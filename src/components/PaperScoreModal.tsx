import type { Document } from "../models/DocumentSchema";
import { scorePaper } from "../utils/paperScore";
import "../styles/PaperScoreModal.css";

type PaperScoreModalProps = {
  doc: Document;
  onClose: () => void;
};

export function PaperScoreModal({ doc, onClose }: PaperScoreModalProps) {
  const report = scorePaper(doc);

  return (
    <div
      className="paper-score-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="paper-score-modal" onClick={(event) => event.stopPropagation()}>
        <div className="paper-score-header">
          <div>
            <h2>Professor Score</h2>
            <p>Elite review of structure, depth, and evidence.</p>
          </div>
          <button className="paper-score-close" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="paper-score-hero">
          <div className="paper-score-number">
            <span className="score-value">{report.score}</span>
            <span className="score-grade">{report.letter}</span>
          </div>
          <div className="paper-score-summary">{report.summary}</div>
        </div>

        <div className="paper-score-grid">
          <div className="paper-score-card">
            <h3>Key Metrics</h3>
            <ul>
              <li>Words: {report.metrics.words.toLocaleString()}</li>
              <li>Paragraphs: {report.metrics.paragraphs}</li>
              <li>Sections: {report.metrics.sections}</li>
              <li>Citations: {report.metrics.citations}</li>
              <li>Read time: {report.metrics.readMinutes} min</li>
            </ul>
          </div>
          <div className="paper-score-card">
            <h3>Strengths</h3>
            <ul>
              {report.strengths.map((item, index) => (
                <li key={`strength-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="paper-score-card">
            <h3>Improvements</h3>
            <ul>
              {report.improvements.map((item, index) => (
                <li key={`improve-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="paper-score-footer">
          Aim for consistent citations, tight transitions, and a clear thesis for A+.
        </div>
      </div>
    </div>
  );
}
