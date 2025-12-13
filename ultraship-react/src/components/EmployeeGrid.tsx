import React from "react";

export interface Employee {
  id: string;
  name: string;
  dob: string;
  clazz: string;
  subjects: string[];
  attendance: number;
  email: string;
  phone: string;
  location: string;
  status: string;
  role: string;
}

interface Props {
  employees: Employee[];
}

export const EmployeeGrid: React.FC<Props> = ({ employees }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Class</th>
          <th>DOB</th>
          <th>Subjects</th>
          <th>Attendance</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Location</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {employees.map(e => (
          <tr key={e.id}>
            <td>{e.name}</td>
            <td>{e.role}</td>
            <td>
              <span className="badge">{e.clazz}</span>
            </td>
            <td>{e.dob}</td>
            <td>
              <div className="subjects">
                {e.subjects.map(subject => (
                  <span key={subject} className="subject-chip">
                    {subject}
                  </span>
                ))}
              </div>
            </td>
            <td>
              <span className="badge">{e.attendance.toFixed(1)}%</span>
            </td>
            <td>{e.email}</td>
            <td>{e.phone}</td>
            <td>{e.location}</td>
            <td>{e.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
