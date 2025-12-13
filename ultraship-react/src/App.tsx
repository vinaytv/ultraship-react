import React, { useEffect, useMemo, useState } from "react";
import { ApolloProvider, useMutation, useQuery } from "@apollo/client";
import { client } from "./apolloClient";
import "./App.css";
import { EmployeeGrid, Employee } from "./components/EmployeeGrid";
import { EmployeeTiles } from "./components/EmployeeTiles";
import { LOGIN, SIGN_UP, EMPLOYEE_BY_ID, EMPLOYEES_PAGE, UPDATE_EMPLOYEE } from "./graphql";
import { LookupItem } from "./types";

const AppHome: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    dob: "",
    email: "",
    password: ""
  });
  const [viewMode, setViewMode] = useState<"grid" | "tiles">("grid");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [navTab, setNavTab] = useState<"home" | "classes" | "settings">("home");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signUpMutation] = useMutation(SIGN_UP);
  const [loginMutation] = useMutation(LOGIN);
  const [updateEmployeeMutation, { loading: updateEmployeeLoading }] = useMutation(UPDATE_EMPLOYEE);
  const [classOptions, setClassOptions] = useState<LookupItem[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<LookupItem[]>([]);
  const [classLoading, setClassLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const baseEmployees: Employee[] = useMemo(() => [], []);
  const [employeeList, setEmployeeList] = useState<Employee[]>(baseEmployees);
  const [adminEditId, setAdminEditId] = useState<string>("");
  const [adminClassInput, setAdminClassInput] = useState("");
  const [adminSubjectsInput, setAdminSubjectsInput] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const isAdmin = currentUser?.role?.toUpperCase().includes("ADMIN") ?? false;
  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      const user = localStorage.getItem("currentUser");
      if (token && user) {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
        setIsAuthed(true);
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    setIsAuthed(false);
    setCurrentUser(null);
    setSelected(null);
    setNavTab("home");
    setLoginForm({ email: "", password: "" });
    setSignupForm({ name: "", dob: "", email: "", password: "" });
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    loginMutation({
      variables: {
        input: {
          email: loginForm.email,
          password: loginForm.password
        }
      }
    })
      .then(res => {
        const token = res.data?.login?.token;
        if (token) {
          localStorage.setItem("authToken", token);
          const emp = res.data?.login?.employee;
          if (emp) {
            setCurrentUser(emp);
            localStorage.setItem("currentUser", JSON.stringify(emp));
          }
          setIsAuthed(true);
          if (emp?.role?.toUpperCase().includes("ADMIN")) {
            refetchEmployees && refetchEmployees();
          }
        } else {
          setAuthError("Login failed");
        }
      })
      .catch(err => setAuthError(err.message || "Login failed"))
      .finally(() => setAuthLoading(false));
  };

  const handleSignup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    signUpMutation({
      variables: {
        input: {
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          dateOfBirth: signupForm.dob
        }
      }
    })
      .then(res => {
        const token = res.data?.signUp?.token;
        if (token) {
          localStorage.setItem("authToken", token);
          const emp = res.data?.signUp?.employee;
          if (emp) {
            setCurrentUser(emp);
            localStorage.setItem("currentUser", JSON.stringify(emp));
          }
          setIsAuthed(true);
          if (emp?.role?.toUpperCase().includes("ADMIN")) {
            refetchEmployees && refetchEmployees();
          }
        } else {
          setAuthError("Signup failed");
        }
      })
      .catch(err => setAuthError(err.message || "Signup failed"))
      .finally(() => setAuthLoading(false));
  };

  const { data: employeeProfile } = useQuery(EMPLOYEE_BY_ID, {
    variables: { id: currentUser?.id ?? "" },
    skip: !isAuthed || !currentUser?.id
  });

  const {
    data: adminEmployeesData,
    loading: adminEmployeesLoading,
    error: adminEmployeesError,
    refetch: refetchEmployees
  } = useQuery(EMPLOYEES_PAGE, {
    variables: { filter: null, sort: { field: "NAME", direction: "ASC" }, page: 0, pageSize: 10 },
    skip: !isAdmin
  });

  useEffect(() => {
    if (adminEmployeesData?.employeesPage?.items?.length) {
      const mapped: Employee[] = adminEmployeesData.employeesPage.items.map((item: any) => {
        const subjects = (item.teachingAssignments ?? [])
          .map((t: any) => t.subjectName)
          .filter(Boolean);
        return {
          id: item.id,
          name: item.name,
          dob: "",
          clazz: item.teachingAssignments?.[0]?.className || "-",
          subjects,
          attendance: item.attendanceSummary?.percentage ?? 0,
          email: item.email,
          phone: "-",
          location: "-",
          status: item.role || "Active",
          role: item.role || "-"
        };
      });
      setEmployeeList(mapped);
      if (mapped.length) {
        setAdminEditId(mapped[0].id);
        setAdminClassInput(mapped[0].clazz);
        setAdminSubjectsInput(mapped[0].subjects.join(", "));
      }
    }
  }, [adminEmployeesData]);

  useEffect(() => {
    if (isAdmin) {
      setNavTab("home");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadLookups = async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        setClassLoading(true);
        setClassError(null);
        const res = await fetch("/api/lookup/classes", {
          headers: {
            ...authHeader
          }
        });
        const data = await res.json();
        setClassOptions(Array.isArray(data) ? data : []);
      } catch {
        setClassError("Failed to load classes");
      } finally {
        setClassLoading(false);
      }
      try {
        setSubjectsLoading(true);
        setSubjectsError(null);
        const res = await fetch("/api/lookup/subjects", {
          headers: {
            ...authHeader
          }
        });
        const data = await res.json();
        setSubjectOptions(Array.isArray(data) ? data : []);
      } catch {
        setSubjectsError("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadLookups();
  }, [isAdmin]);

  useEffect(() => {
    const emp = employeeList.find(e => e.id === adminEditId);
    if (!emp) return;
    const classMatch = classOptions.find(c => c.name === emp.clazz);
    setSelectedClassId(classMatch?.id || "");
    setAdminClassInput(classMatch?.name || emp.clazz || "");
    const subjectIds = subjectOptions.filter(s => emp.subjects.includes(s.name)).map(s => s.id);
    setSelectedSubjectIds(subjectIds);
    setAdminSubjectsInput(emp.subjects.join(", "));
  }, [adminEditId, employeeList, classOptions, subjectOptions]);

  useEffect(() => {
    const names = subjectOptions.filter(s => selectedSubjectIds.includes(s.id)).map(s => s.name);
    setAdminSubjectsInput(names.join(", "));
  }, [selectedSubjectIds, subjectOptions]);

  const profile = employeeProfile?.employee;
  const profileView = useMemo(() => {
    if (profile) {
      const classNames =
        profile.teachingAssignments?.map((t: any) => t.className).filter(Boolean) ?? profile.classNames ?? [];
      const subjects =
        profile.teachingAssignments?.map((t: any) => t.subjectName).filter(Boolean) ?? profile.subjects ?? [];
      return {
        ...profile,
        classNames,
        subjects
      };
    }
    if (currentUser)
      return {
        ...currentUser,
        dateOfBirth: profile?.dateOfBirth || "",
        classNames: [],
        subjects: [],
        attendanceSummary: { percentage: undefined }
      };
    return null;
  }, [profile, currentUser]);
  const filteredEmployees = useMemo(
    () =>
      employeeList.filter(emp => {
        const term = adminSearch.toLowerCase();
        return emp.name.toLowerCase().includes(term) || emp.email.toLowerCase().includes(term);
      }),
    [adminSearch, employeeList]
  );

  return (
    <div className="app-shell">
      <div className="content">
        {!isAuthed ? (
          <>
            <header className="topbar">
              <div className="brand">
                <div className="pill">Ultraship Faculty</div>
                <div>
                  <h1 className="title">Access, Attendance & Roster</h1>
                  <p className="subtitle">Control attendance, roster, and approvals with a clean dual-mode entry.</p>
                </div>
              </div>
              <div className="toolbar">
                <div className="toggle" role="tablist" aria-label="Auth">
                  <button
                    className={authMode === "login" ? "active" : ""}
                    aria-pressed={authMode === "login"}
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                  >
                    Login
                  </button>
                  <button
                    className={authMode === "signup" ? "active" : ""}
                    aria-pressed={authMode === "signup"}
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError(null);
                    }}
                  >
                    Signup
                  </button>
                </div>
              </div>
            </header>

            <div className="auth-layout">
              <div className="hero-blurb">
                <div className="pill">Why Ultraship</div>
                <h2 className="title" style={{ margin: "10px 0 6px" }}>
                  Attendance & roster, streamlined
                </h2>
                <p className="muted">
                  Keep employees in sync with precise attendance, role clarity, and quick approvals—all in one place.
                </p>
                <div className="info-grid">
                  <div className="info-chip">
                    <strong>Role-aware</strong>
                    <span className="muted">Admins invite-only; employees self-serve.</span>
                  </div>
                  <div className="info-chip">
                    <strong>Approvals</strong>
                    <span className="muted">Attendance routed for review, not instant.</span>
                  </div>
                  <div className="info-chip">
                    <strong>Roster ready</strong>
                    <span className="muted">Class, subjects, and attendance together.</span>
                  </div>
                </div>
              </div>

              <div className="panel form-card">
                {authMode === "login" ? (
                  <>
                    <h2 className="title">Login</h2>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Enter your credentials to access your workspace.
                    </p>
                    <form className="form-grid" onSubmit={handleLogin}>
                      <label className="field">
                        <span>Email</span>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={loginForm.email}
                          onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                          onInvalid={e => e.currentTarget.setCustomValidity("Invalid email")}
                          onInput={e => e.currentTarget.setCustomValidity("")}
                        />
                      </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </label>
                  {authError && <p className="error">{authError}</p>}
                  <button className="primary-btn" type="submit" disabled={authLoading}>
                    Continue
                  </button>
                </form>
              </>
            ) : (
                  <>
                    <h2 className="title">Employee signup</h2>
                    <p className="muted note" style={{ marginTop: 4 }}>
                      <strong>Note:</strong> Admins remain invite-only; new accounts start as employees. Subjects, class, and ID will be assigned by admin.
                    </p>
                    <form className="form-grid" onSubmit={handleSignup}>
                      <label className="field">
                        <span>Name</span>
                        <input
                          type="text"
                          required
                          value={signupForm.name}
                          onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>DOB</span>
                        <input
                          type="date"
                          required
                          value={signupForm.dob}
                          onChange={e => setSignupForm({ ...signupForm, dob: e.target.value })}
                          max={today}
                          placeholder="YYYY-MM-DD"
                        />
                      </label>
                      <label className="field">
                        <span>Email</span>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={signupForm.email}
                          onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                          onInvalid={e => e.currentTarget.setCustomValidity("Invalid email")}
                          onInput={e => e.currentTarget.setCustomValidity("")}
                        />
                      </label>
                      <label className="field">
                        <span>Password</span>
                        <input
                          type="password"
                          required
                          value={signupForm.password}
                          onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                        />
                      </label>
                      {authError && <p className="error">{authError}</p>}
                      <button className="primary-btn" type="submit" disabled={authLoading}>
                        Create employee account
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="topbar nav-shell">
              <div className="brand">
                <div>
                  <h1 className="title">Employee Hub</h1>
                  <p className="subtitle">Roster grid and tile views with quick details.</p>
                </div>
              </div>
              <nav className="horizontal-menu">
                <button className={`menu-item ${navTab === "home" ? "active" : ""}`} onClick={() => setNavTab("home")}>
                  Home
                </button>
                <button className={`menu-item ${navTab === "classes" ? "active" : ""}`} onClick={() => setNavTab("classes")}>
                  Classes
                </button>
                <button className={`menu-item ${navTab === "settings" ? "active" : ""}`} onClick={() => setNavTab("settings")}>
                  Settings
                </button>
                <button className="menu-item" onClick={handleSignOut}>
                  Sign out
                </button>
              </nav>
            </header>

            {navTab === "home" && (
              <div className="panel form-card">
                <h2 className="title">My Profile</h2>
                {profileView ? (
                  <div className="info-grid">
                    <div className="info-chip">
                      <strong>Name</strong>
                      <span className="muted">{profileView.name}</span>
                    </div>
                    <div className="info-chip">
                      <strong>Email</strong>
                      <span className="muted">{profileView.email}</span>
                    </div>
                    <div className="info-chip">
                      <strong>DOB</strong>
                      <span className="muted">{(profileView as any).dateOfBirth || "—"}</span>
                    </div>
                    <div className="info-chip">
                      <strong>Role</strong>
                      <span className="muted">{profileView.role}</span>
                    </div>
                    <div className="info-chip">
                      <strong>Classes</strong>
                      <span className="muted">
                        {(profileView as any).classNames?.length ? (profileView as any).classNames.join(", ") : "—"}
                      </span>
                    </div>
                    <div className="info-chip">
                      <strong>Subjects</strong>
                      <span className="muted">
                        {(profileView as any).subjects?.length ? (profileView as any).subjects.join(", ") : "—"}
                      </span>
                    </div>
                    <div className="info-chip">
                      <strong>Attendance</strong>
                      <span className="muted">
                        {(profileView as any).attendanceSummary?.percentage != null
                          ? `${(profileView as any).attendanceSummary.percentage.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="muted">Loading your profile…</p>
                )}
              </div>
            )}

            {isAdmin && (
              <div className="panel form-card">
                <div className="section-header">
                  <div>
                    <h2 className="title" style={{ marginBottom: 4 }}>
                      Admin — Employees
                    </h2>
                    <p className="muted">Edit class and subjects.</p>
                  </div>
                </div>
                {adminEmployeesLoading && <p className="muted">Loading employees…</p>}
                {adminEmployeesError && <p className="error">Error loading employees.</p>}
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Search employees</span>
                    <input
                      type="text"
                      placeholder="Search by name or email"
                      value={adminSearch}
                      onChange={e => setAdminSearch(e.target.value)}
                    />
                  </label>
                  {adminEditId && (
                    <div className="info-block">
                      <div className="muted">Editing</div>
                      <strong>{employeeList.find(e => e.id === adminEditId)?.name}</strong>
                    </div>
                  )}
                </div>
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Class</span>
                    <select
                      value={selectedClassId}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedClassId(val);
                        const opt = classOptions.find(c => c.id === val);
                        setAdminClassInput(opt?.name || "");
                      }}
                      disabled={classLoading || !classOptions.length}
                    >
                      <option value="">Select a class</option>
                      {classOptions.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {classError && <span className="error">{classError}</span>}
                  </label>
                  <div className="field">
                    <span>Subjects</span>
                    <div className="subjects checkbox-list">
                      {subjectsLoading && <span className="muted">Loading subjects…</span>}
                      {subjectsError && <span className="error">{subjectsError}</span>}
                      {!subjectsLoading &&
                        subjectOptions.map(sub => (
                          <label key={sub.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(sub.id)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setSelectedSubjectIds(prev =>
                                  checked ? [...prev, sub.id] : prev.filter(id => id !== sub.id)
                                );
                              }}
                            />
                            <span>{sub.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                  <div className="field">
                    <span>&nbsp;</span>
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => {
                        const className = classOptions.find(c => c.id === selectedClassId)?.name || "";
                        const subjectNames = subjectOptions
                          .filter(s => selectedSubjectIds.includes(s.id))
                          .map(s => s.name);
                        updateEmployeeMutation({
                          variables: {
                            id: adminEditId,
                            input: {
                              name: employeeList.find(e => e.id === adminEditId)?.name,
                              email: employeeList.find(e => e.id === adminEditId)?.email,
                              role: employeeList.find(e => e.id === adminEditId)?.role,
                              subjectAssignments: selectedSubjectIds.map(sid => ({
                                classId: selectedClassId,
                                subjectId: sid
                              })),
                              deleteUser: false
                            }
                          }
                        })
                          .then(res => {
                            const updated = res.data?.updateEmployee;
                            if (updated) {
                              const newSubjects =
                                updated.teachingAssignments?.map((t: any) => t.subjectName).filter(Boolean) ??
                                subjectNames;
                              setEmployeeList(prev =>
                                prev.map(emp =>
                                  emp.id === adminEditId
                                    ? {
                                        ...emp,
                                        clazz: updated.teachingAssignments?.[0]?.className || className || emp.clazz,
                                        subjects: newSubjects,
                                        attendance: updated.attendanceSummary?.percentage ?? emp.attendance,
                                        role: updated.role || emp.role,
                                        email: updated.email || emp.email
                                      }
                                    : emp
                                )
                              );
                              setAdminClassInput(updated.teachingAssignments?.[0]?.className || className);
                              setAdminSubjectsInput(newSubjects.join(", "));
                            }
                          })
                          .catch(() => {
                            // ignore errors for now
                          });
                      }}
                      disabled={!adminEditId || updateEmployeeLoading}
                    >
                      {updateEmployeeLoading ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Subjects</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map(emp => (
                        <tr key={emp.id}>
                          <td>{emp.name}</td>
                          <td>{emp.clazz}</td>
                          <td>{emp.subjects.join(", ")}</td>
                          <td>{emp.role}</td>
                          <td>{emp.status}</td>
                          <td>
                            <button
                              className="ghost-btn"
                              type="button"
                              onClick={() => {
                                setAdminEditId(emp.id);
                                setAdminClassInput(emp.clazz);
                                setAdminSubjectsInput(emp.subjects.join(", "));
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredEmployees.length && (
                        <tr>
                          <td colSpan={6} className="muted">
                            No employees match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {navTab === "classes" && (
              <div className="panel form-card">
                <h2 className="title">Classes</h2>
                <p className="muted">Classes view coming soon.</p>
              </div>
            )}

            {navTab === "settings" && (
              <div className="panel form-card">
                <h2 className="title">Settings</h2>
                <p className="muted">Settings panel coming soon.</p>
              </div>
            )}

          </>
        )}
      </div>

      {isAuthed && selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)} aria-label="Back to tiles">
              ← Back
            </button>
            <h3 className="title" style={{ marginBottom: 6 }}>
              {selected.name}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {selected.role} — {selected.clazz}
            </p>
            <div className="meta-grid">
              <div className="meta-block">
                <div className="muted">DOB</div>
                <strong>{selected.dob}</strong>
              </div>
              <div className="meta-block">
                <div className="muted">Attendance</div>
                <strong>{selected.attendance.toFixed(1)}%</strong>
              </div>
              <div className="meta-block">
                <div className="muted">Status</div>
                <strong>{selected.status}</strong>
              </div>
              <div className="meta-block">
                <div className="muted">Location</div>
                <strong>{selected.location}</strong>
              </div>
            </div>
            <div className="subjects">
              {selected.subjects.map(s => (
                <span key={s} className="subject-chip">
                  {s}
                </span>
              ))}
            </div>
            <div className="meta-grid" style={{ marginTop: 12 }}>
              <div className="meta-block">
                <div className="muted">Email</div>
                <strong>{selected.email}</strong>
              </div>
              <div className="meta-block">
                <div className="muted">Phone</div>
                <strong>{selected.phone}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <AppHome />
    </ApolloProvider>
  );
};
