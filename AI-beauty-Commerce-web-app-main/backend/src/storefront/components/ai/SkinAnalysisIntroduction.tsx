import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import './SkinAnalysisExperience.css';
import './SkinAnalysisIntroduction.css';

const CALLOUTS = [
  { id: '01', label: 'Surface texture', note: 'Visible smoothness & detail', x: 100, y: 88, point: [485, 132], line: '485,132 370,88 100,88' },
  { id: '02', label: 'Shine', note: 'How light meets the skin', x: 755, y: 110, point: [545, 174], line: '545,174 675,110 900,110' },
  { id: '03', label: 'Tone appearance', note: 'Visible colour variation', x: 100, y: 235, point: [448, 205], line: '448,205 335,235 100,235' },
  { id: '04', label: 'Visible dry areas', note: 'Surface flaking, if visible', x: 755, y: 265, point: [542, 222], line: '542,222 680,265 900,265' },
  { id: '05', label: 'Care pointers', note: 'A gentle routine to explore', x: 755, y: 375, point: [505, 257], line: '505,257 680,375 900,375' },
];

export default function SkinAnalysisIntroduction() {
  return (
    <div className="skin-page skin-overview">
      <main>
        <section className="skin-overview-hero" aria-labelledby="skin-overview-title">
          <div className="skin-overview-kicker"><span /> DESLA SKIN INTELLIGENCE <span className="skin-overview-edition">01 / DISCOVER</span></div>
          <div className="skin-face-diagram">
            <svg viewBox="0 0 1000 440" role="img" aria-labelledby="skin-face-title skin-face-description">
              <title id="skin-face-title">Five pointers to a more thoughtful skin routine</title>
              <desc id="skin-face-description">An illustrated 3D face with five gold markers and connecting lines for surface texture, shine, tone appearance, visible dry areas, and care pointers. These demonstrate the photo review, not a scan of a real person.</desc>
              <defs><clipPath id="skin-face-crop"><rect x="300" y="0" width="400" height="410" rx="28" /></clipPath></defs>
              <image href="/beauty_face_3d.jpg" x="300" y="0" width="400" height="410" preserveAspectRatio="xMidYMid slice" clipPath="url(#skin-face-crop)" />
              {CALLOUTS.map((item, index) => (
                <g key={item.id} className="skin-face-callout" style={{ animationDelay: `${index * 90}ms` }}>
                  <polyline points={item.line} className="skin-face-connector" />
                  <circle cx={item.point[0]} cy={item.point[1]} r="12" className="skin-face-halo" />
                  <circle cx={item.point[0]} cy={item.point[1]} r="5" className="skin-face-point" />
                  <text x={item.x} y={item.y - 28} className="skin-face-label">{item.label}</text>
                  <text x={item.x} y={item.y + 24} className="skin-face-note">{item.note}</text>
                </g>
              ))}
            </svg>
            <p className="skin-diagram-caption">ILLUSTRATED PREVIEW · YOUR PHOTO COMES NEXT</p>
          </div>
          <div className="skin-overview-copy">
            <h1 id="skin-overview-title">Discover what your skin needs.</h1>
            <p>Get to know your skin beyond the mirror. A photo can offer clues about visible texture, shine, and tone appearance — and a starting point for thoughtful everyday care.</p>
            <Link className="skin-try-link" href="/skin-analysis/scan">Try it out <ArrowRight size={18} /></Link>
            <span className="skin-try-note">Take a photo or upload one on the next page. No account needed.</span>
          </div>
        </section>

        <section className="skin-overview-details" aria-labelledby="skin-details-title">
          <div className="skin-details-heading"><span className="skin-eyebrow">A CLOSER LOOK, WITH CONTEXT</span><h2 id="skin-details-title">From your photo to your routine.</h2><p>Your skin is individual. Lighting, makeup, and camera quality all affect what a photo can show.</p></div>
          <div className="skin-explainer-table" role="table" aria-label="How the skin photo review works">
            <div className="skin-explainer-row skin-explainer-head" role="row"><span role="columnheader">THE STEP</span><span role="columnheader">WHAT HAPPENS</span><span role="columnheader">WHAT YOU RECEIVE</span></div>
            {[
              ['01 / Your photo', 'Capture or upload one clear, well-lit photo of your face.', 'A review based on your own photo, rather than the illustration above.'],
              ['02 / AI review', 'With your permission, Gemini reviews visible skin appearance.', 'Tentative observations about texture, shine, and visible tone variation.'],
              ['03 / Your care', 'Turn those observations into a gentle starting routine.', 'Practical care pointers, with the limits of the photo clearly explained.'],
            ].map(([step, action, outcome]) => <div className="skin-explainer-row" role="row" key={step}><strong role="cell">{step}</strong><span role="cell">{action}</span><span role="cell">{outcome}</span></div>)}
          </div>
          <p className="skin-overview-limit">A cosmetic photo review, not a diagnosis. Photos cannot measure hydration, barrier function, or reliably determine your skin type. For persistent concerns, speak to a dermatologist.</p>
        </section>
      </main>
      <footer className="skin-footer"><Link href="/">Desla!</Link><span>Health before beauty. Always.</span><Link href="/">Back to waitlist</Link></footer>
    </div>
  );
}
