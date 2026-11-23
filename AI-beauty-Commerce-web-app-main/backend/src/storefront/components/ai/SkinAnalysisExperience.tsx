'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { Camera, Upload, ScanFace, ArrowRight, X, ShieldCheck, LoaderCircle } from 'lucide-react';

import type { SkinAnalysis } from '@/lib/skin-analysis';
import { submitSkinPhoto } from '@/lib/skin-analysis-client';

import './SkinAnalysisExperience.css';

export default function SkinAnalysisExperience() {

  const [photo, setPhoto] = useState<File | null>(null);

  const [preview, setPreview] = useState('');

  const [consent, setConsent] = useState(false);

  const [camera, setCamera] = useState(false);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const [result, setResult] = useState<SkinAnalysis | null>(null);

  const feedback = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  const stream = useRef<MediaStream | null>(null);

  const controller = useRef<AbortController | null>(null);

  const cameraAttempt = useRef(0);

  useEffect(() => {

    if (!photo) { setPreview(''); return; }

    const url = URL.createObjectURL(photo);

    setPreview(url);

    return () => URL.revokeObjectURL(url);

  }, [photo]);

  useEffect(() => {

    if (camera && video.current && stream.current) video.current.srcObject = stream.current;

  }, [camera]);

  useEffect(() => () => {

    cameraAttempt.current++;

    stream.current?.getTracks().forEach(track => track.stop());

    controller.current?.abort();

  }, []);

  useEffect(() => {
    if (result) feedback.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [result]);

  function stopCamera() {

    cameraAttempt.current++;

    stream.current?.getTracks().forEach(track => track.stop());

    stream.current = null;

    setCamera(false);

  }

  async function startCamera() {

    setError('');

    const attempt = ++cameraAttempt.current;

    try {

      if (!navigator.mediaDevices?.getUserMedia) throw new Error();

      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false });

      if (attempt !== cameraAttempt.current) { media.getTracks().forEach(track => track.stop()); return; }

      stream.current?.getTracks().forEach(track => track.stop());

      stream.current = media;

      setCamera(true);

    } catch {

      setError('Camera access is unavailable. Allow camera access in your browser, or upload a photo instead.');

    }

  }

  function choosePhoto(file?: File) {

    if (!file) return;

    setError('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {

      setError('Choose a JPEG, PNG, or WebP photo under 5 MB.'); return;

    }

    stopCamera();

    setPhoto(file); setResult(null); setConsent(false);

  }

  function capture() {

    const element = video.current;

    if (!element?.videoWidth) { setError('The camera is still starting. Please try again.'); return; }

    const canvas = document.createElement('canvas');

    canvas.width = element.videoWidth; canvas.height = element.videoHeight;

    canvas.getContext('2d')?.drawImage(element, 0, 0);

    canvas.toBlob(blob => { if (blob) choosePhoto(new File([blob], 'skin-photo.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.9);

  }

  function cancelAnalysis() {
    const active = controller.current;
    controller.current = null;
    active?.abort();
    setBusy(false);
  }

  async function analyze() {
    if (!photo || !consent || controller.current) return;
    const active = new AbortController();
    controller.current = active;
    setBusy(true); setError(''); setResult(null);
    try {
      const analysis = await submitSkinPhoto(photo, { signal: active.signal });
      if (controller.current === active) setResult(analysis);
    } catch (failure) {
      if (controller.current === active && !(failure instanceof Error && failure.name === 'AbortError')) {
        setError(failure instanceof Error ? failure.message : 'Connection failed. Please try again.');
      }
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  function clear() {

    cancelAnalysis(); stopCamera(); setPhoto(null); setResult(null); setConsent(false); setError('');

  }

  return (

    <div className="skin-page">

      <main>

        <div className="skin-scan-back"><Link href="/skin-analysis">Back to skin analysis</Link><span>PHOTO REVIEW / 02</span></div>

        <nav className="skin-scan-mobile-steps" aria-label="Skin analysis steps">
          <Link href="/skin-analysis" className="skin-step skin-step-done">
            <span className="skin-step-num">01</span> Preview
          </Link>
          <span className="skin-step-line skin-step-line-complete" aria-hidden="true" />
          <span className="skin-step skin-step-active" aria-current="step">
            <span className="skin-step-num">02</span> AI Review
          </span>
        </nav>

        <section className="skin-workspace" id="try-scan" aria-labelledby="try-title">

          <div className="skin-workspace-heading"><span className="skin-eyebrow">YOUR SKIN, A LITTLE CLEARER</span><h1 id="try-title">Try your skin scan</h1><p className="skin-workspace-desc-desktop">Use a clear photo of your face in natural light, without filters. This is cosmetic guidance, not a medical diagnosis.</p><p className="skin-workspace-desc-mobile">Take or upload one clear photo in natural light.</p></div>

          <div className="skin-scan-panel">

            <div className="skin-photo-panel">

              {camera ? <><video ref={video} autoPlay muted playsInline aria-label="Live camera preview" /><div className="skin-camera-actions"><button onClick={capture}>Capture photo</button><button onClick={stopCamera}>Close camera</button></div></> : preview ? <><img src={preview} alt="Your selected photo for review" /><button className="skin-clear" onClick={clear} disabled={busy} aria-label="Remove photo"><X size={18} /></button></> : <div className="skin-photo-empty"><ScanFace size={44} strokeWidth={1} /><strong>A fresh perspective starts here.</strong><p>Your photo stays in this browser until you choose to analyze it.</p></div>}

            </div>

            <div className="skin-upload-panel"><span className="skin-eyebrow">01 / CHOOSE YOUR PHOTO</span><h3>Let’s see your natural glow.</h3><p>Face the camera, keep your whole face visible, and find soft, even light. Upload only a photo of yourself.</p><div className="skin-source-actions"><button onClick={startCamera} disabled={busy || camera}><Camera size={17} /> Use camera</button><label className={busy ? 'skin-disabled' : ''}><Upload size={17} /> Upload photo<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { choosePhoto(event.target.files?.[0]); event.target.value=''; }} /></label></div><small>JPEG, PNG, or WebP · Up to 5 MB</small>

              <label className="skin-consent"><input type="checkbox" checked={consent} disabled={!photo || busy} onChange={event => setConsent(event.target.checked)} /><span>I agree to send this photo to Google Gemini for AI analysis. Desla does not save my photo or results. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Google’s data terms</a> apply.</span></label>

              <button className="skin-analyze" onClick={analyze} disabled={!photo || !consent || busy}>{busy ? <><LoaderCircle size={18} className="skin-spinner" /> Analyzing your photo…</> : <>Analyze my skin <ArrowRight size={17} /></>}</button>

              {busy && <button className="skin-cancel" onClick={cancelAnalysis}>Cancel analysis</button>}

              <p className="skin-privacy"><ShieldCheck size={16} /> No account needed. Clear your photo whenever you like.</p>

            </div>

          </div>

          {error && <p className="skin-error" role="alert">{error}</p>}

          <div ref={feedback} aria-live="polite" aria-busy={busy}>{result && <section className="skin-results"><span className="skin-eyebrow">{result.usable ? 'YOUR PHOTO REVIEW' : 'LET’S TRY ANOTHER PHOTO'}</span><h2>{result.usable ? 'A little insight. A thoughtful routine.' : 'We need a clearer view.'}</h2><p>{result.summary}</p>{result.usable && <div className="skin-result-columns"><div><h3>Visible observations</h3>{result.observations.map((item,i)=><article key={i}><h4>{item.area}</h4><p>{item.detail}</p></article>)}</div><div><h3>Your gentle care routine</h3>{result.routine.map((item,i)=><article key={i}><h4>{String(i+1).padStart(2,'0')} · {item.step}</h4><p>{item.advice}</p></article>)}</div></div>}<p className="skin-limitations">{result.limitations}</p><p className="skin-limitations">A photo cannot measure hydration, barrier integrity, or diagnose disease. See a qualified dermatologist for persistent concerns or a changing skin lesion.</p><button onClick={clear} className="skin-reset">Clear photo & results</button></section>}</div>

        </section>

      </main>

      <footer className="skin-footer"><Link href="/">Desla!</Link><span>Health before beauty. Always.</span><Link href="/#faqs">Help & FAQs</Link></footer>

    </div>

  );

}

