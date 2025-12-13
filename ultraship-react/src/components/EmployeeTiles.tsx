import React from "react";
import type { Employee } from "./EmployeeGrid";

interface Props {
  employees: Employee[];
  onSelect: (e: Employee) => void;
}

export const EmployeeTiles: React.FC<Props> = ({ employees, onSelect }) => {
  return (
    <div className="tiles">
      {employees.map(e => (
        <div key={e.id} className="tile" onClick={() => onSelect(e)} aria-label={`View ${e.name}`}>
          <button className="bun-btn" onClick={ev => ev.stopPropagation()} aria-label="Tile options">
            ⋮
          </button>
          <h3 className="tile-name">{e.name}</h3>
          <p className="tile-meta">{e.role}</p>
          <p className="tile-meta">Class: {e.clazz}</p>
          <p className="tile-meta">DOB: {e.dob}</p>
          <p className="tile-meta">Location: {e.location}</p>
          <div className="tile-attendance">
            <span>Attendance</span>
            <strong>{e.attendance.toFixed(1)}%</strong>
          </div>
        </div>
      ))}
    </div>
  );
};
