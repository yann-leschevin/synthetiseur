'use strict';

(() => {
    const $ = (id) => document.getElementById(id);

    const canvasL = $('scope-left');
    const canvasR = $('scope-right');
    const canvasWrap = document.querySelector('.scope-grid');
    const ctxL = canvasL.getContext('2d');
    const ctxR = canvasR.getContext('2d');
    const micBtn = $('mic-btn');
    const micBtnLabel = $('mic-btn-label');
    const listenSlider = $('listen-slider');
    const listenValue = $('listen-value');
    const listenBtn = $('listen-btn');
    const listenState = $('listen-state');
    const listenWarning = $('listen-warning');
    const zoomSlider = $('zoom-slider');
    const zoomValue = $('zoom-value');
    const sizeSlider = $('size-slider');
    const sizeValue = $('size-value');
    const sourceSelect = $('source-select');
    const scopeStatus = $('scope-status');
    const scopeStatusText = $('scope-status-text');
    const statusPill = $('status-pill');
    const statusText = $('status-text');
    const sampleRateEl = $('sample-rate');
    const leftLabel = $('channel-left');
    const rightLabel = $('channel-right');
    const scopeMode = $('scope-mode');
    const meterL = $('meter-left');
    const meterR = $('meter-right');
    const dbL = $('db-left');
    const dbR = $('db-right');
    const freqDisplay = $('freq-display');
    const freqValue = $('freq-value');
    const freqNote = $('freq-note');

    const sourceLabels = {
        micro: 'Micro reconnu',
        other: 'Application détectée',
        chrome: 'Chrome connecté'
    };

    let audioCtx = null;
    let listenGain = null;
    let listenAllowed = false;
    let analyserL = null;
    let analyserR = null;
    let source = null;
    let splitter = null;
    let stream = null;
    let dataL = null;
    let dataR = null;
    let running = false;
    let sourceType = sourceSelect.value;
    let animationFrameId = null;
    let captureSeq = 0;
    let forcedMono = false;
    let currentMode = 'stereo';
    const modeWindow = 45;
    const modeHistory = [];
    let peakL = 0;
    let peakR = 0;

    // Fenetre d'analyse (FFT_SIZE) plus longue que la fenetre affichee
    // (DISPLAY_SIZE) : la marge sert a choisir le point de declenchement.
    const FFT_SIZE = 8192;
    const DISPLAY_SIZE = 2048;
    let triggerRef = null;
    let frameCount = 0;
    let pitchHistory = [];
    let lastPitchTime = 0;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        [canvasL, canvasR].forEach((canvas) => {
            const pw = Math.max(1, Math.round(canvas.clientWidth * dpr));
            const ph = Math.max(1, Math.round(canvas.clientHeight * dpr));
            if (pw !== canvas.width || ph !== canvas.height) {
                canvas.width = pw;
                canvas.height = ph;
            }
        });
        ctxL.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxR.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Remplissage visuel de la piste des curseurs.
    function paintRange(range) {
        const min = Number(range.min) || 0;
        const max = Number(range.max) || 100;
        const pct = ((Number(range.value) - min) / (max - min)) * 100;
        range.style.setProperty('--fill', pct + '%');
    }

    document.querySelectorAll('.range').forEach((r) => {
        paintRange(r);
        r.addEventListener('input', () => paintRange(r));
    });

    sizeSlider.addEventListener('input', () => {
        const size = parseInt(sizeSlider.value, 10);
        sizeValue.textContent = size;
        canvasWrap.style.width = size + '%';
        requestAnimationFrame(resizeCanvas);
    });

    canvasWrap.addEventListener('transitionend', resizeCanvas);

    listenSlider.addEventListener('input', () => {
        listenValue.textContent = listenSlider.value;
        updateListenGain();
    });

    zoomSlider.addEventListener('input', () => {
        zoomValue.textContent = zoomSlider.value;
    });

    listenBtn.addEventListener('click', () => {
        if (!running) return;
        listenAllowed = !listenAllowed;
        updateListen();
    });

    sourceSelect.addEventListener('change', async () => {
        sourceType = sourceSelect.value;
        if (running) {
            await startCapture();
        }
    });

    micBtn.addEventListener('click', () => {
        if (running) {
            stopCapture();
        } else {
            startCapture();
        }
    });

    function getAnnouncedChannelCount() {
        try {
            const tracks = stream && stream.getAudioTracks ? stream.getAudioTracks() : [];
            if (tracks.length) {
                const settings = tracks[0].getSettings();
                const count = settings && settings.channelCount;
                if (typeof count === 'number' && count >= 1) return count;
            }
        } catch (e) { /* getSettings non supporte */ }
        return null;
    }

    async function startCapture() {
        const seq = ++captureSeq;
        try {
            if (!navigator.mediaDevices || !window.isSecureContext) {
                const err = new Error('Contexte non sécurisé : ouvrez http://localhost ou utilisez HTTPS');
                err.name = 'InsecureContext';
                throw err;
            }
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            stopTracks();
            setPending();

            let mediaStream;
            if (sourceType === 'micro') {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                });
            } else {
                const displaySurface = sourceType === 'other' ? 'window' : 'browser';
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
                    video: { displaySurface }
                });
                mediaStream.getVideoTracks().forEach(t => t.stop());
                if (!mediaStream.getAudioTracks().length) {
                    mediaStream.getTracks().forEach(t => t.stop());
                    const err = new Error('Aucun son partagé : cochez « Partager l\'audio »');
                    err.name = 'NoAudioTrack';
                    throw err;
                }
            }

            if (seq !== captureSeq) {
                mediaStream.getTracks().forEach(t => t.stop());
                return;
            }

            stream = mediaStream;
            // Arret du partage depuis le navigateur (bandeau « Arreter le partage »).
            stream.getAudioTracks().forEach((t) => {
                t.addEventListener('ended', () => {
                    if (seq === captureSeq && running) stopCapture('Partage arrêté');
                });
            });

            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(stream);

            analyserL = audioCtx.createAnalyser();
            analyserR = audioCtx.createAnalyser();
            analyserL.fftSize = FFT_SIZE;
            analyserR.fftSize = FFT_SIZE;
            dataL = new Float32Array(FFT_SIZE);
            dataR = new Float32Array(FFT_SIZE);
            triggerRef = null;
            resetPitch();

            splitter = audioCtx.createChannelSplitter(2);
            listenGain = audioCtx.createGain();
            listenGain.connect(audioCtx.destination);
            source.connect(splitter);
            source.connect(listenGain);
            splitter.connect(analyserL, 0);
            splitter.connect(analyserR, 1);

            running = true;
            forcedMono = getAnnouncedChannelCount() === 1;
            modeHistory.length = 0;
            currentMode = forcedMono ? 'mono' : 'stereo';
            updateModeUI();
            listenAllowed = sourceType !== 'micro';
            updateListen();
            setMicState(true, sourceLabels[sourceType]);
            sampleRateEl.textContent = (audioCtx.sampleRate / 1000).toFixed(1) + ' kHz';
            sampleRateEl.hidden = false;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            animationFrameId = requestAnimationFrame(draw);
        } catch (err) {
            if (seq !== captureSeq) return;
            running = false;
            stopTracks();
            updateModeUI();
            updateListenUI();
            listenWarning.hidden = true;
            setMicState(false, errorMessage(err), true);
        }
    }

    function errorMessage(err) {
        switch (err && err.name) {
            case 'NotAllowedError': return 'Accès refusé par l\'utilisateur';
            case 'NotFoundError': return 'Aucun périphérique audio trouvé';
            case 'NotReadableError': return 'Périphérique déjà utilisé';
            case 'InsecureContext':
            case 'NoAudioTrack': return err.message;
            default: return 'Erreur : ' + ((err && (err.name || err.message)) || 'inconnue');
        }
    }

    function stopTracks() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        if (source) { source.disconnect(); source = null; }
        if (splitter) { splitter.disconnect(); splitter = null; }
        if (listenGain) { listenGain.disconnect(); listenGain = null; }
        if (audioCtx) { audioCtx.close(); audioCtx = null; }
        analyserL = null;
        analyserR = null;
        dataL = null;
        dataR = null;
    }

    function stopCapture(reason) {
        captureSeq++;
        running = false;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        stopTracks();
        [ctxL, ctxR].forEach((c) => {
            c.save();
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, c.canvas.width, c.canvas.height);
            c.restore();
        });
        resetMeters();
        resetPitch();
        triggerRef = null;
        currentMode = 'stereo';
        updateModeUI();
        updateListenUI();
        listenWarning.hidden = true;
        setMicState(false, typeof reason === 'string' ? reason : 'Source arrêtée');
    }

    function updateListenGain() {
        if (!listenGain) return;
        listenGain.gain.value = listenAllowed
            ? parseInt(listenSlider.value, 10) / 100
            : 0;
    }

    function updateListenWarning() {
        if (!running || sourceType !== 'micro') {
            listenWarning.hidden = true;
            return;
        }
        listenWarning.hidden = false;
        listenWarning.classList.toggle('warn-active', listenAllowed);
        listenWarning.classList.toggle('warn', !listenAllowed);
        listenWarning.textContent = listenAllowed
            ? 'Écoute du micro activée : portez un casque pour éviter le larsen.'
            : 'Écoute du micro coupée par défaut (anti-larsen). Activez-la avec le bouton ÉCOUTE, casque sur les oreilles.';
    }

    function updateListen() {
        updateListenGain();
        updateListenWarning();
        updateListenUI();
    }

    function updateListenUI() {
        const active = running && listenAllowed;
        listenBtn.classList.toggle('active', active);
        listenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
        listenBtn.disabled = !running;
        if (active) {
            listenState.textContent = sourceType === 'micro'
                ? 'ÉCOUTE : ON · ⚠️ Casque recommandé'
                : 'ÉCOUTE : ON';
        } else {
            listenState.textContent = 'ÉCOUTE : OFF';
        }
        listenState.classList.toggle('on', active);
        listenState.classList.toggle('warn', active && sourceType === 'micro');
    }

    function setPending() {
        statusPill.className = 'pill pending';
        statusText.textContent = 'Connexion…';
        micBtn.classList.add('pending');
    }

    function setMicState(active, label, isError) {
        micBtn.classList.remove('pending');
        micBtn.classList.toggle('active', active);
        micBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
        micBtnLabel.textContent = active ? 'Arrêter la source' : 'Activer la source';
        statusPill.className = 'pill' + (active ? ' live' : isError ? ' error' : '');
        statusText.textContent = active ? label + ' · LIVE' : label;
        scopeStatus.classList.toggle('hidden', active);
        scopeStatus.classList.toggle('error', !!isError);
        scopeStatusText.textContent = active
            ? 'Écoute de ' + sourceSelect.options[sourceSelect.selectedIndex].text.toLowerCase()
            : (isError ? label : 'En attente de la source…');
        if (!active) sampleRateEl.hidden = true;
    }

    function updateModeUI() {
        if (!running) {
            scopeMode.hidden = true;
            leftLabel.textContent = 'Gauche';
            rightLabel.textContent = 'Droite';
            return;
        }
        const mono = currentMode === 'mono';
        scopeMode.hidden = false;
        scopeMode.textContent = mono ? 'Mono' : 'Stéréo';
        scopeMode.classList.toggle('mono', mono);
        leftLabel.textContent = mono ? 'Gauche (mono)' : 'Gauche';
        rightLabel.textContent = mono ? 'Droite (mono)' : 'Droite';
    }

    function drawChannel(canvas, c, dataArray, start, gain, c1, c2, glow) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        c.clearRect(0, 0, w, h);

        const mid = h / 2;

        // Graticule : 10 divisions horizontales, 8 verticales.
        c.lineWidth = 1;
        c.strokeStyle = 'rgba(255,255,255,0.045)';
        c.beginPath();
        for (let i = 1; i < 10; i++) {
            const x = Math.round((w / 10) * i) + 0.5;
            c.moveTo(x, 0); c.lineTo(x, h);
        }
        for (let i = 1; i < 8; i++) {
            const y = Math.round((h / 8) * i) + 0.5;
            c.moveTo(0, y); c.lineTo(w, y);
        }
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.12)';
        c.beginPath();
        c.moveTo(0, Math.round(mid) + 0.5);
        c.lineTo(w, Math.round(mid) + 0.5);
        c.moveTo(Math.round(w / 2) + 0.5, 0);
        c.lineTo(Math.round(w / 2) + 0.5, h);
        c.stroke();

        const grad = c.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        c.strokeStyle = grad;
        c.lineWidth = Math.max(1.5, h * 0.004);
        c.lineCap = 'round';
        c.lineJoin = 'round';
        // Halo leger : un flou trop large dedouble visuellement le trace.
        c.shadowColor = glow;
        c.shadowBlur = 4;

        c.beginPath();
        const slice = w / (DISPLAY_SIZE - 1);
        for (let i = 0; i < DISPLAY_SIZE; i++) {
            const v = dataArray[start + i] * gain;
            const y = mid - v * (h * 0.96);
            const x = i * slice;
            if (i === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
        }
        c.stroke();
        c.shadowBlur = 0;
    }

    function computeLevel(dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i];
            sum += v * v;
        }
        return Math.sqrt(sum / dataArray.length);
    }

    function channelCorrelation(a, b) {
        let ma = 0;
        let mb = 0;
        for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; }
        ma /= a.length;
        mb /= b.length;
        let num = 0;
        let da = 0;
        let db = 0;
        for (let i = 0; i < a.length; i++) {
            const x = a[i] - ma;
            const y = b[i] - mb;
            num += x * y;
            da += x * x;
            db += y * y;
        }
        return (da === 0 || db === 0) ? 1 : num / Math.sqrt(da * db);
    }

    const MIN_SIGNAL_LEVEL = 0.04;
    const DUP_CORRELATION = 0.985;

    function detectMode(levelL, levelR) {
        const lActive = levelL > MIN_SIGNAL_LEVEL;
        const rActive = levelR > MIN_SIGNAL_LEVEL;
        if (lActive && !rActive) return 'mono';
        if (lActive && rActive && channelCorrelation(dataL, dataR) > DUP_CORRELATION) return 'mono';
        return null;
    }

    // VU-metre : niveau RMS en dBFS, plage affichee -60..0 dB, retombee douce.
    function updateMeter(fill, label, level, peak) {
        const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
        const norm = Math.max(0, Math.min(1, (db + 60) / 60));
        const next = Math.max(norm, peak * 0.92);
        fill.style.transform = 'scaleX(' + next.toFixed(3) + ')';
        label.textContent = isFinite(db) && db > -60 ? db.toFixed(1) + ' dB' : '-∞ dB';
        label.classList.toggle('hot', db > -3);
        return next;
    }

    function resetMeters() {
        peakL = 0;
        peakR = 0;
        [meterL, meterR].forEach((m) => { m.style.transform = 'scaleX(0)'; });
        [dbL, dbR].forEach((d) => { d.textContent = '-∞ dB'; d.classList.remove('hot'); });
    }

    // ---------- Declenchement (trigger) ----------
    // Sans synchronisation, chaque image commence a une phase differente du
    // signal : l'oeil superpose les images successives et voit une courbe
    // floue ou dedoublee. On cale donc chaque image sur un front montant,
    // en choisissant celui qui ressemble le plus a l'image precedente.
    const TRIGGER_STEP = 4;

    function findTrigger(data, period) {
        const maxStart = data.length - DISPLAY_SIZE;
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
            const a = Math.abs(data[i]);
            if (a > peak) peak = a;
        }
        if (peak < 1e-3) return maxStart;

        // Hysteresis : le signal doit passer sous -hyst puis au-dessus de 0.
        const hyst = peak * 0.1;
        // On cherche dans les derniers echantillons (les plus recents), sur au
        // moins une periode pour toujours trouver un front si le son est periodique.
        const span = Math.min(maxStart, Math.max(DISPLAY_SIZE, period ? Math.ceil(period * 2) : DISPLAY_SIZE));
        const from = maxStart - span;
        const candidates = [];
        let armed = false;
        for (let i = from; i < maxStart; i++) {
            if (data[i] < -hyst) armed = true;
            if (armed && data[i] < 0 && data[i + 1] >= 0) {
                candidates.push(i);
                armed = false;
            }
        }
        if (!candidates.length) return maxStart;

        // Choix du front le plus coherent avec l'image precedente.
        let best = candidates[candidates.length - 1];
        if (triggerRef) {
            let bestScore = -Infinity;
            for (const cand of candidates) {
                let score = 0;
                for (let j = 0, k = 0; k < triggerRef.length; j += TRIGGER_STEP, k++) {
                    score += data[cand + j] * triggerRef[k];
                }
                if (score > bestScore) { bestScore = score; best = cand; }
            }
        }

        // L'image retenue (lissee) devient la reference de l'image suivante.
        const len = Math.floor(DISPLAY_SIZE / TRIGGER_STEP);
        if (!triggerRef || triggerRef.length !== len) {
            triggerRef = new Float32Array(len);
            for (let k = 0; k < len; k++) triggerRef[k] = data[best + k * TRIGGER_STEP];
        } else {
            for (let k = 0; k < len; k++) {
                triggerRef[k] = triggerRef[k] * 0.6 + data[best + k * TRIGGER_STEP] * 0.4;
            }
        }
        return best;
    }

    // ---------- Detection de frequence (methode de McLeod / NSDF) ----------
    const PITCH_WINDOW = 2048;
    const PITCH_MIN_HZ = 40;
    const PITCH_MAX_HZ = 4000;
    const PITCH_CLARITY = 0.85;
    const PITCH_HOLD_MS = 350;
    const NOTE_NAMES = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    let nsdf = null;

    function detectPitch(data, sampleRate) {
        const n = PITCH_WINDOW;
        const maxLag = Math.min(Math.ceil(sampleRate / PITCH_MIN_HZ), data.length - n - 2);
        const minLag = Math.floor(sampleRate / PITCH_MAX_HZ);
        const offset = data.length - n - maxLag - 1;
        if (maxLag <= minLag) return null;
        if (!nsdf || nsdf.length !== maxLag + 1) nsdf = new Float32Array(maxLag + 1);

        for (let tau = 0; tau <= maxLag; tau++) {
            let acf = 0;
            let m = 0;
            for (let i = 0; i < n; i++) {
                const a = data[offset + i];
                const b = data[offset + i + tau];
                acf += a * b;
                m += a * a + b * b;
            }
            nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
        }

        // Pics positifs entre deux passages par zero de la NSDF.
        const peaks = [];
        let tau = 1;
        while (tau < maxLag && nsdf[tau] > 0) tau++;
        let bestTau = -1;
        let bestVal = -Infinity;
        for (; tau < maxLag; tau++) {
            if (nsdf[tau] > 0) {
                if (nsdf[tau] > bestVal) { bestVal = nsdf[tau]; bestTau = tau; }
            } else if (bestTau > 0) {
                peaks.push(bestTau);
                bestTau = -1;
                bestVal = -Infinity;
            }
        }
        if (bestTau > 0) peaks.push(bestTau);
        if (!peaks.length) return null;

        let globalMax = 0;
        for (const p of peaks) if (nsdf[p] > globalMax) globalMax = nsdf[p];
        if (globalMax < PITCH_CLARITY) return null;

        // Premier pic proche du maximum : evite les erreurs d'octave.
        const threshold = globalMax * 0.9;
        let chosen = peaks.find((p) => nsdf[p] >= threshold);
        if (chosen < minLag) {
            chosen = peaks.find((p) => p >= minLag && nsdf[p] >= threshold);
            if (!chosen) return null;
        }

        // Interpolation parabolique autour du pic.
        const y0 = nsdf[chosen - 1];
        const y1 = nsdf[chosen];
        const y2 = nsdf[chosen + 1];
        const denom = y0 - 2 * y1 + y2;
        const shift = denom !== 0 ? 0.5 * (y0 - y2) / denom : 0;
        const period = chosen + shift;
        return { freq: sampleRate / period, period };
    }

    function noteName(freq) {
        const midi = Math.round(69 + 12 * Math.log2(freq / 440));
        const octave = Math.floor(midi / 12) - 1;
        return NOTE_NAMES[((midi % 12) + 12) % 12] + octave;
    }

    function showPitch(freq) {
        const now = performance.now();
        if (freq) {
            pitchHistory.push(freq);
            if (pitchHistory.length > 5) pitchHistory.shift();
            const sorted = pitchHistory.slice().sort((a, b) => a - b);
            const f = sorted[Math.floor(sorted.length / 2)];
            freqValue.textContent = f >= 1000 ? f.toFixed(0) : f.toFixed(1);
            freqNote.textContent = noteName(f);
            freqDisplay.classList.add('detected');
            lastPitchTime = now;
        } else if (now - lastPitchTime > PITCH_HOLD_MS) {
            resetPitch();
        }
    }

    function resetPitch() {
        pitchHistory = [];
        lastPitchTime = 0;
        freqValue.textContent = '—';
        freqNote.textContent = '';
        freqDisplay.classList.remove('detected');
    }

    let lastPeriod = 0;

    function draw() {
        if (!running || !analyserL || !analyserR) return;
        animationFrameId = requestAnimationFrame(draw);

        resizeCanvas();

        analyserL.getFloatTimeDomainData(dataL);
        analyserR.getFloatTimeDomainData(dataR);

        const levelL = computeLevel(dataL);
        const levelR = computeLevel(dataR);

        if (!forcedMono) {
            const frameMode = detectMode(levelL, levelR);
            if (frameMode) {
                modeHistory.push(frameMode);
                if (modeHistory.length > modeWindow) modeHistory.shift();
                let monoCount = 0;
                for (const m of modeHistory) if (m === 'mono') monoCount++;
                const nextMode = monoCount > modeHistory.length / 2 ? 'mono' : 'stereo';
                if (nextMode !== currentMode) {
                    currentMode = nextMode;
                    updateModeUI();
                }
            }
        }

        const mono = currentMode === 'mono';
        peakL = updateMeter(meterL, dbL, levelL, peakL);
        peakR = updateMeter(meterR, dbR, mono ? levelL : levelR, peakR);

        // Canal de reference (le plus fort) pour la frequence et le declenchement.
        const ref = (mono || levelL >= levelR) ? dataL : dataR;
        const refLevel = Math.max(levelL, mono ? 0 : levelR);

        // Detection de frequence une image sur deux (calcul couteux).
        if (++frameCount % 2 === 0) {
            const pitch = refLevel > 0.01 ? detectPitch(ref, audioCtx.sampleRate) : null;
            lastPeriod = pitch ? pitch.period : 0;
            showPitch(pitch && pitch.freq);
        }

        // Meme point de declenchement pour les deux canaux : la relation de
        // phase gauche/droite est conservee.
        const start = findTrigger(ref, lastPeriod);

        const gain = parseInt(zoomSlider.value, 10) / 100;
        drawChannel(canvasL, ctxL, dataL, start, gain, '#22d3ee', '#8b5cf6', 'rgba(34,211,238,0.45)');
        drawChannel(canvasR, ctxR, mono ? dataL : dataR, start, gain, '#8b5cf6', '#f472b6', 'rgba(244,114,182,0.45)');
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pagehide', () => { if (running) stopCapture(); });
    resizeCanvas();
})();
