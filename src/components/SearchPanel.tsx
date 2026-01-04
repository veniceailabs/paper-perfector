import type { ScholarResult } from "../models/Scholar";
import type { SearchResult, SearchScope } from "../models/Search";
import type { Source } from "../models/DocumentSchema";
import "../styles/SearchPanel.css";

type AppAction = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SearchPanelProps = {
  findQuery: string;
  onFindQueryChange: (value: string) => void;
  replaceValue: string;
  onReplaceValueChange: (value: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  searchResults: SearchResult[];
  onNavigate: (sectionId: string) => void;
  scholarQuery: string;
  onScholarQueryChange: (value: string) => void;
  onScholarSearch: () => void;
  scholarResults: ScholarResult[];
  scholarStatus: "idle" | "loading" | "error";
  scholarError?: string | null;
  selectedScholarId: string | null;
  onSelectScholar: (id: string) => void;
  savedSources: Source[];
  onSaveSource: (source: Source) => void;
  onInsertCitation: (source: Source) => void;
  onInsertReference: (source: Source) => void;
  onRemoveSource: (sourceId: string) => void;
  canInsert: boolean;
  onReplaceNext: () => void;
  onReplaceAll: () => void;
  actions: AppAction[];
  onAction: (actionId: string) => void;
  onClose: () => void;
};

const scopeLabels: Record<keyof SearchScope, string> = {
  title: "Titles",
  body: "Body",
  metadata: "Metadata",
};

const matchLabels: Record<SearchResult["matchType"], string> = {
  title: "Title",
  body: "Body",
  metadata: "Metadata",
};

export function SearchPanel({
  findQuery,
  onFindQueryChange,
  replaceValue,
  onReplaceValueChange,
  searchScope,
  onSearchScopeChange,
  searchResults,
  onNavigate,
  scholarQuery,
  onScholarQueryChange,
  onScholarSearch,
  scholarResults,
  scholarStatus,
  scholarError,
  selectedScholarId,
  onSelectScholar,
  savedSources,
  onSaveSource,
  onInsertCitation,
  onInsertReference,
  onRemoveSource,
  canInsert,
  onReplaceNext,
  onReplaceAll,
  actions,
  onAction,
  onClose,
}: SearchPanelProps) {
  const handleScopeToggle = (key: keyof SearchScope) => {
    onSearchScopeChange({ ...searchScope, [key]: !searchScope[key] });
  };

  const hasQuery = findQuery.trim().length > 0;
  const selectedScholar =
    scholarResults.find((result) => result.id === selectedScholarId) ?? null;
  const mapScholarToSource = (result: ScholarResult): Source => ({
    id: result.id,
    title: result.title,
    authors: result.authors,
    year: result.year,
    venue: result.venue,
    url: result.url,
    pdfUrl: result.pdfUrl,
  });
  const savedSourceIds = new Set(savedSources.map((source) => source.id));
  const selectedSource = selectedScholar ? mapScholarToSource(selectedScholar) : null;
  const isSelectedSaved = selectedSource
    ? savedSourceIds.has(selectedSource.id)
    : false;

  return (
    <div className="search-panel-backdrop" onClick={onClose} role="presentation">
      <aside
        className="search-panel"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="search-panel-header">
          <div>
            <h2>Find & Navigate</h2>
            <p>Search the document, replace text, or jump to app actions.</p>
          </div>
          <button
            type="button"
            className="search-panel-close"
            onClick={onClose}
            aria-label="Close search panel"
          >
            ✕
          </button>
        </header>

        <section className="search-panel-section">
          <h3>Find</h3>
          <div className="search-panel-field">
            <input
              type="search"
              className="search-panel-input"
              placeholder="Find in document"
              value={findQuery}
              onChange={(event) => onFindQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault();
                  onNavigate(searchResults[0].sectionId);
                }
                if (event.key === "Escape") {
                  onFindQueryChange("");
                }
              }}
              aria-label="Find in document"
            />
            {hasQuery ? (
              <button
                type="button"
                className="search-panel-clear"
                onClick={() => onFindQueryChange("")}
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="search-scope">
            {(Object.keys(scopeLabels) as Array<keyof SearchScope>).map((key) => (
              <button
                key={key}
                type="button"
                className={`search-scope-toggle ${
                  searchScope[key] ? "active" : ""
                }`}
                onClick={() => handleScopeToggle(key)}
              >
                {scopeLabels[key]}
              </button>
            ))}
          </div>
          <div className="search-panel-results">
            {hasQuery ? (
              searchResults.length ? (
                searchResults.map((result, index) => (
                  <button
                    key={`${result.sectionId}-${index}`}
                    type="button"
                    className="search-result"
                    onClick={() => onNavigate(result.sectionId)}
                  >
                    <div className="search-result-header">
                      <span className="search-result-title">{result.title}</span>
                      <span className="search-result-tag">
                        {matchLabels[result.matchType]}
                      </span>
                    </div>
                    <span className="search-result-snippet">{result.snippet}</span>
                  </button>
                ))
              ) : (
                <div className="search-panel-empty">No matches found.</div>
              )
            ) : (
              <div className="search-panel-empty">Start typing to search.</div>
            )}
          </div>
        </section>

        <section className="search-panel-section">
          <h3>Find & Replace</h3>
          <div className="search-panel-field">
            <input
              type="text"
              className="search-panel-input"
              placeholder="Replace with"
              value={replaceValue}
              onChange={(event) => onReplaceValueChange(event.target.value)}
              aria-label="Replace with"
            />
          </div>
          <div className="search-panel-actions">
            <button
              type="button"
              className="search-panel-button"
              onClick={onReplaceNext}
              disabled={!hasQuery}
            >
              Replace Next
            </button>
            <button
              type="button"
              className="search-panel-button primary"
              onClick={onReplaceAll}
              disabled={!hasQuery}
            >
              Replace All
            </button>
          </div>
        </section>

        <section className="search-panel-section">
          <h3>Google Scholar</h3>
          <p className="search-panel-note">
            Results shown in-app (OpenAlex metadata).
          </p>
          <div className="search-panel-field scholar">
            <input
              type="search"
              className="search-panel-input"
              placeholder="Search Scholar"
              value={scholarQuery}
              onChange={(event) => onScholarQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onScholarSearch();
                }
              }}
              aria-label="Search Google Scholar"
            />
            <button
              type="button"
              className="search-panel-button primary"
              onClick={onScholarSearch}
            >
              Search
            </button>
          </div>
          <div className="scholar-results">
            {scholarStatus === "loading" ? (
              <div className="search-panel-empty">Searching...</div>
            ) : null}
            {scholarStatus === "error" ? (
              <div className="search-panel-empty">
                {scholarError ?? "Scholar search failed."}
              </div>
            ) : null}
            {scholarStatus === "idle" && scholarResults.length === 0 ? (
              <div className="search-panel-empty">
                Search to view scholarly sources.
              </div>
            ) : null}
            {scholarResults.map((result) => (
              <button
                key={result.id}
                type="button"
                className={`scholar-result ${
                  selectedScholarId === result.id ? "active" : ""
                }`}
                onClick={() => onSelectScholar(result.id)}
              >
                <span className="scholar-title">{result.title}</span>
                <span className="scholar-meta">
                  {[
                    result.authors.slice(0, 3).join(", "),
                    result.year,
                    result.venue,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </button>
            ))}
          </div>
          {selectedScholar ? (
            <div className="scholar-detail">
              <h4>{selectedScholar.title}</h4>
              <p className="scholar-detail-meta">
                {[
                  selectedScholar.authors.join(", "),
                  selectedScholar.year,
                  selectedScholar.venue,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              {selectedScholar.abstract ? (
                <p className="scholar-detail-abstract">
                  {selectedScholar.abstract}
                </p>
              ) : (
                <p className="scholar-detail-abstract">
                  No abstract available for this source.
                </p>
              )}
              <div className="scholar-detail-actions">
                {selectedSource ? (
                  <button
                    type="button"
                    className="search-panel-button"
                    onClick={() => onSaveSource(selectedSource)}
                    disabled={isSelectedSaved}
                  >
                    {isSelectedSaved ? "Saved" : "Save Source"}
                  </button>
                ) : null}
                {selectedSource ? (
                  <button
                    type="button"
                    className="search-panel-button"
                    onClick={() => onInsertCitation(selectedSource)}
                    disabled={!canInsert}
                  >
                    Insert Citation
                  </button>
                ) : null}
                {selectedSource ? (
                  <button
                    type="button"
                    className="search-panel-button"
                    onClick={() => onInsertReference(selectedSource)}
                    disabled={!canInsert}
                  >
                    Insert Reference
                  </button>
                ) : null}
                {selectedScholar.pdfUrl ? (
                  <a
                    className="search-panel-button"
                    href={selectedScholar.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open PDF
                  </a>
                ) : null}
                {selectedScholar.url ? (
                  <a
                    className="search-panel-button"
                    href={selectedScholar.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source Link
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="search-panel-section">
          <h3>Saved Sources</h3>
          {savedSources.length === 0 ? (
            <div className="search-panel-empty">
              No sources saved yet. Save one from Scholar search.
            </div>
          ) : (
            <div className="saved-sources">
              {savedSources.map((source) => (
                <div key={source.id} className="saved-source">
                  <div className="saved-source-meta">
                    <strong>{source.title}</strong>
                    <span>
                      {[source.authors[0], source.year, source.venue]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                  <div className="saved-source-actions">
                    <button
                      type="button"
                      className="search-panel-button"
                      onClick={() => onInsertCitation(source)}
                      disabled={!canInsert}
                    >
                      Cite
                    </button>
                    <button
                      type="button"
                      className="search-panel-button"
                      onClick={() => onInsertReference(source)}
                      disabled={!canInsert}
                    >
                      Reference
                    </button>
                    <button
                      type="button"
                      className="search-panel-button"
                      onClick={() => onRemoveSource(source.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="search-panel-section">
          <h3>App Navigation</h3>
          <div className="search-panel-grid">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="search-panel-action"
                onClick={() => onAction(action.id)}
                disabled={action.disabled}
              >
                <span className="action-label">{action.label}</span>
                {action.description ? (
                  <span className="action-description">{action.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
