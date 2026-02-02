import React, { useEffect, useState } from 'react';
import '../styles/CasesManager.css';

const LOCAL_STORAGE_CASES_KEY = 'bargad_cases';

function loadCasesFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCasesToStorage(cases) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(cases));
  } catch (e) {
    console.warn('Could not save cases to localStorage', e);
  }
}

function mergeCases(apiCases, localCases) {
  const byId = new Map();
  (localCases || []).forEach((c) => byId.set(c.sessionId, c));
  (apiCases || []).forEach((c) => byId.set(c.sessionId, c));
  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const da = (a.date && new Date(a.date)) || 0;
    const db = (b.date && new Date(b.date)) || 0;
    return db - da;
  });
  return merged;
}

const CasesManager = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const localCases = loadCasesFromStorage();
      let apiCases = [];
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cases`);
        const data = await response.json();
        if (data.success && Array.isArray(data.cases)) apiCases = data.cases;
      } catch {
        // API failed or unavailable; use localStorage only
      }
      const merged = mergeCases(apiCases, localCases);
      const withCaseNumbers = merged.map((c, i) => ({
        ...c,
        caseNumber: c.caseNumber || `CASE-${String(i + 1).padStart(6, '0')}`,
      }));
      setCases(withCaseNumbers);
      saveCasesToStorage(withCaseNumbers);
    } catch (err) {
      console.error('Error fetching cases:', err);
      const localOnly = loadCasesFromStorage();
      if (localOnly.length > 0) {
        const withCaseNumbers = localOnly.map((c, i) => ({
          ...c,
          caseNumber: c.caseNumber || `CASE-${String(i + 1).padStart(6, '0')}`,
        }));
        setCases(withCaseNumbers);
      } else {
        setError('Error loading cases');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = (sessionId) => {
    const dashboardUrl = `/dashboard/${sessionId}`;
    window.open(dashboardUrl, '_blank');
  };

  const totalPages = Math.ceil(cases.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCases = cases.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="cases-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cases-manager">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchCases}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cases-manager">
      <header className="cases-header">
        <div className="header-left">
          <img src="/new-logo.png" alt="Bargad.ai" className="logo" />
        </div>
        <button className="logout-btn">Logout</button>
      </header>

      <div className="cases-container">
        <div className="breadcrumb">
          <span>Case Summary</span>
          <span className="separator">/</span>
          <span className="active">Case List</span>
        </div>

        <h1 className="cases-title">Case List</h1>

        <div className="cases-table-wrapper">
          <table className="cases-table">
            <thead>
              <tr>
                <th>
                  Case Number
                  <span className="sort-icon">↕</span>
                </th>
                <th>
                  Lead No.
                  <span className="sort-icon">↕</span>
                </th>
                <th>
                  Created Date
                  <span className="sort-icon">↕</span>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentCases.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    No cases found
                  </td>
                </tr>
              ) : (
                currentCases.map((caseItem) => (
                  <tr key={caseItem.sessionId}>
                    <td>{caseItem.caseNumber}</td>
                    <td>{caseItem.leadNo}</td>
                    <td>{caseItem.date}</td>
                    <td>
                      <span className="status-badge">{caseItem.status}</span>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewDashboard(caseItem.sessionId)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="table-footer">
            <div className="page-size-selector">
              <label>Page Size:</label>
              <select value={pageSize} onChange={handlePageSizeChange}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-info">
              {startIndex + 1} to {Math.min(endIndex, cases.length)} of {cases.length}
            </div>

            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                «
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                ‹
              </button>
              <span className="page-number">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                ›
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="cases-footer">
        <p>© 2024 Bargad.ai. All rights reserved.</p>
        <p className="powered-by">
          Powered by <span className="brand">🌳 Bargad.ai</span>
        </p>
      </footer>
    </div>
  );
};

export default CasesManager;
