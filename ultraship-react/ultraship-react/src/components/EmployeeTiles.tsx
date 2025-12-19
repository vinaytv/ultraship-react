import React, { useState } from "react";
import type { Employee } from "./EmployeeGrid";

interface Props {
  employees: Employee[];
  onSelect: (e: Employee) => void;
}

export const EmployeeTiles: React.FC<Props> = ({ employees, onSelect }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="tiles">
      {employees.map(e => {
        const isOpen = openMenuId === e.id;
        return (
          <div key={e.id} className="tile" onClick={() => onSelect(e)} aria-label={`View ${e.name}`}>
            <div className="tile-top">
              <span className="mini-pill">{e.id}</span>
              <span className="pill mini">{e.clazz}</span>
              <button
                className="bun-btn"
                onClick={ev => {
                  ev.stopPropagation();
                  setOpenMenuId(prev => (prev === e.id ? null : e.id));
                }}
                aria-label="Tile options"
              >
                ⋮
              </button>
              {isOpen && (
                <div className="bun-menu" role="menu">
                  <button role="menuitem" onClick={() => onSelect(e)}>
                    View details
                  </button>
                  <button role="menuitem" className="warn">
                    Flag
                  </button>
                  <button role="menuitem" className="danger">
                    Delete
                  </button>
                </div>
              )}
            </div>
            <h3 className="tile-name">{e.name}</h3>
            <p className="tile-meta">{e.role}</p>
            <p className="tile-meta">Location: {e.location}</p>
            <div className="tile-attendance">
              <div>
                <span className="muted">Attendance</span>
                <strong>{e.attendance.toFixed(1)}%</strong>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(100, e.attendance)}%` }} />
              </div>
            </div>
            <div className="subjects">
              {e.subjects.slice(0, 2).map(subject => (
                <span key={subject} className="subject-chip">
                  {subject}
                </span>
              ))}
            </div>
            <div className="tile-footer">
              <span className={`status-chip ${e.status.toLowerCase().replace(/\s+/g, "-")}`}>{e.status}</span>
              <span className="tile-meta">DOB {e.dob}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
