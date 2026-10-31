import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './owned-api';
export type ScanStage = 'intro' | 'capture' | 'processing' | 'results';
type Assessment = { result: { facePresent: boolean; suitableForAnalysis: boolean; skinType: string; observations: string[]; summary: string; limitations: string }; recommendations: { slug: string; available: number }[] };
export function useFaceScan() {
  const [flowStep, setFlowStep] = useState<ScanStage>('intro');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [consent, setConsent] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const stopCamera = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setCameraActive(false); };
  useEffect(() => {
    let active = true;
    apiFetch<{ available: boolean }>('/api/skin-scan').then(value => { if (active) setAvailable(value.available); }).catch(() => { if (active) setAvailable(false); });
    return () => { active = false; generation.current++; stream.current?.getTracks().forEach(track => track.stop()); };
  }, []);
  useEffect(() => {
    if (flowStep !== 'capture' || capturedImage) return;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access is unavailable. You can upload a photo below.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(value => {
      if (cancelled) { value.getTracks().forEach(track => track.stop()); return; }
      stream.current = value; setCameraActive(true);
    }).catch(() => { if (!cancelled) setError('Camera access was unavailable. You can upload a photo below.'); });
    return () => { cancelled = true; stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setCameraActive(false); };
  }, [flowStep, capturedImage]);
  useEffect(() => { if (cameraActive && stream.current && videoRef.current) { videoRef.current.srcObject = stream.current; void videoRef.current.play().catch(() => {}); } }, [cameraActive]);
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5_000_000) { setError('Choose a JPEG, PNG or WebP photo under 5 MB.'); return; }
    const attempt = ++generation.current;
    try {
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      if (attempt !== generation.current) return;
      stopCamera(); setCapturedImage(canvas.toDataURL('image/jpeg', 0.85)); setConsent(false); setError(''); setAssessment(null);
    } catch { if (attempt === generation.current) setError('This photo could not be opened. Choose another image.'); }
  };
  const startScan = async () => {
    if (flowStep === 'processing') return;
    if (!consent) { setError('Please consent to photo analysis before continuing.'); return; }
    let photo = capturedImage;
    if (!photo && videoRef.current?.videoWidth) {
      const source = videoRef.current; const scale = Math.min(1, 1024 / Math.max(source.videoWidth, source.videoHeight)); const canvas = document.createElement('canvas');
      canvas.width = Math.round(source.videoWidth * scale); canvas.height = Math.round(source.videoHeight * scale);
      canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height); photo = canvas.toDataURL('image/jpeg', 0.85);
    }
    if (!photo) { setError('Take or upload your own photo. The 3D reference image is only a guide.'); return; }
    const attempt = ++generation.current; setError(''); setCapturedImage(photo); stopCamera(); setFlowStep('processing');
    try {
      const value = await apiFetch<Assessment>('/api/skin-scan', { method: 'POST', body: JSON.stringify({ image: photo, consentAccepted: true, consentVersion: '2026-10-30-face-v1' }) });
      if (attempt !== generation.current) return;
      if (!value.result.facePresent || !value.result.suitableForAnalysis) { setError('Choose a clearer face photo in even lighting.'); setFlowStep('capture'); return; }
      setAssessment(value); setFlowStep('results');
    } catch (error) { if (attempt === generation.current) { setError(error instanceof Error ? error.message : 'Analysis could not be completed. Please retry.'); setFlowStep('capture'); } }
  };
  const retake = () => { generation.current++; setAssessment(null); setCapturedImage(''); setConsent(false); setError(''); setFlowStep('capture'); };
  return { flowStep, setFlowStep, videoRef, cameraActive, capturedImage, consent, setConsent, available, error, uploadPhoto, startScan, retake, assessment };
}

