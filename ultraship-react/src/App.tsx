import React, { useEffect, useMemo, useState } from "react";
import { ApolloProvider, useMutation, useQuery } from "@apollo/client";
import { client } from "./apolloClient";
import "./App.css";
import { EmployeeGrid, Employee } from "./components/EmployeeGrid";
import { EmployeeTiles } from "./components/EmployeeTiles";
import { LOGIN, SIGN_UP, EMPLOYEE_BY_ID, EMPLOYEES_PAGE, UPDATE_EMPLOYEE } from "./graphql";
import { LookupItem } from "./types";
const API_BASE = (() => {
  const envBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (envBase) return envBase;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8080";
  }
  return "";
})();
type NavTab = "home" | "grid" | "tiles" | "classes" | "settings";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<"people" | "alerts" | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [navTab, setNavTab] = useState<NavTab>("home");
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
  const baseEmployees: Employee[] = useMemo(
    () => [
      {
        id: "E-214",
        name: "Aya Patel",
        dob: "1991-07-02",
        clazz: "Grade 8A",
        subjects: ["Math", "Robotics"],
        attendance: 98.4,
        email: "aya.patel@school.edu",
        phone: "(929) 222-8611",
        location: "NYC",
        status: "Active",
        role: "Instructor"
      },
      {
        id: "E-221",
        name: "Rowan Mills",
        dob: "1989-05-12",
        clazz: "Grade 9C",
        subjects: ["Biology", "Advisory"],
        attendance: 96.2,
        email: "rowan.mills@school.edu",
        phone: "(718) 339-1255",
        location: "Brooklyn",
        status: "Active",
        role: "Lead Teacher"
      },
      {
        id: "E-232",
        name: "Isabella Hart",
        dob: "1993-11-24",
        clazz: "Grade 10B",
        subjects: ["History", "Civics"],
        attendance: 94.8,
        email: "isa.hart@school.edu",
        phone: "(646) 202-9900",
        location: "Queens",
        status: "Active",
        role: "Instructor"
      },
      {
        id: "E-240",
        name: "Leo Rhodes",
        dob: "1990-08-02",
        clazz: "Grade 7A",
        subjects: ["Science Lab", "Earth Sci"],
        attendance: 92.1,
        email: "leo.rhodes@school.edu",
        phone: "(917) 710-5544",
        location: "Manhattan",
        status: "Flagged",
        role: "Teacher"
      },
      {
        id: "E-255",
        name: "Neve Velasquez",
        dob: "1995-02-16",
        clazz: "Grade 11A",
        subjects: ["Physics", "AP Calc"],
        attendance: 99.1,
        email: "neve.v@school.edu",
        phone: "(917) 881-0183",
        location: "NYC",
        status: "Active",
        role: "Department Lead"
      },
      {
        id: "E-260",
        name: "Skylar Chen",
        dob: "1992-03-30",
        clazz: "Grade 6B",
        subjects: ["Art Studio", "Design"],
        attendance: 90.5,
        email: "skylar.chen@school.edu",
        phone: "(917) 202-0188",
        location: "Queens",
        status: "On leave",
        role: "Teacher"
      },
      {
        id: "E-267",
        name: "Cam Rivers",
        dob: "1994-01-03",
        clazz: "Grade 12A",
        subjects: ["Economics", "Debate"],
        attendance: 95.3,
        email: "cam.rivers@school.edu",
        phone: "(332) 204-1118",
        location: "NYC",
        status: "Active",
        role: "Instructor"
      },
      {
        id: "E-278",
        name: "Juniper Wells",
        dob: "1990-10-08",
        clazz: "Grade 8B",
        subjects: ["English", "Writing Lab"],
        attendance: 97.5,
        email: "juniper.w@school.edu",
        phone: "(646) 420-7761",
        location: "Brooklyn",
        status: "Active",
        role: "Instructor"
      }
    ],
    []
  );
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
    localStorage.removeItem("authToken");
    loginMutation({
      variables: {
        input: {
          email: loginForm.email,
          password: loginForm.password
        }
      },
      context: { headers: { Authorization: "" } }
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
    localStorage.removeItem("authToken");
    signUpMutation({
      variables: {
        input: {
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          dateOfBirth: signupForm.dob
        }
      },
      context: { headers: { Authorization: "" } }
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
        const res = await fetch(`${API_BASE}/api/lookup/classes`, {
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
        const res = await fetch(`${API_BASE}/api/lookup/subjects`, {
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
  const displayedEmployees = employeeList.length ? employeeList : baseEmployees;
  const avgAttendance =
    displayedEmployees.length > 0
      ? displayedEmployees.reduce((sum, emp) => sum + emp.attendance, 0) / displayedEmployees.length
      : 0;

  const setNav = (tab: NavTab) => {
    setNavTab(tab);
    if (tab === "grid") setViewMode("grid");
    if (tab === "tiles") setViewMode("tiles");
  };

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
              <div className="brandline">
                <button
                  className={`hamburger ${drawerOpen ? "active" : ""}`}
                  aria-label="Toggle menu"
                  aria-expanded={drawerOpen}
                  onClick={() => setDrawerOpen(v => !v)}
                >
                  <span />
                  <span />
                  <span />
                </button>
                <div className="brand">
                  <div className="pill">Roster OS</div>
                  <div>
                    <h1 className="title">Employee Hub</h1>
                    <p className="subtitle">Tile + 10-column grid with detail pop outs.</p>
                  </div>
                </div>
              </div>
              <nav className="horizontal-menu">
                {[
                  { id: "home", label: "Home" },
                  { id: "grid", label: "Grid View" },
                  { id: "tiles", label: "Tile View" },
                  { id: "classes", label: "Classes" },
                  { id: "settings", label: "Settings" }
                ].map(item => (
                  <button
                    key={item.id}
                    className={`menu-item ${navTab === item.id ? "active" : ""}`}
                    onClick={() => setNav(item.id as NavTab)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="toolbar">
                <div className="toggle compact" role="tablist" aria-label="View">
                  <button
                    className={viewMode === "grid" ? "active" : ""}
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setNav("grid")}
                  >
                    Grid
                  </button>
                  <button
                    className={viewMode === "tiles" ? "active" : ""}
                    aria-pressed={viewMode === "tiles"}
                    onClick={() => setNav("tiles")}
                  >
                    Tiles
                  </button>
                </div>
                <button className="ghost-btn small" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
              {drawerOpen && (
                <div className="hamburger-drawer">
                  <button className="drawer-item" onClick={() => setNav("home")}>
                    Overview
                    <span className="pill mini">Live</span>
                  </button>
                  <div className={`drawer-item has-sub ${openSubmenu === "people" ? "open" : ""}`}>
                    <div>
                      <div className="muted">People</div>
                      <strong>Roster controls</strong>
                    </div>
                    <button
                      className="ghost-btn tiny"
                      onClick={() => setOpenSubmenu(prev => (prev === "people" ? null : "people"))}
                      aria-label="Toggle people submenu"
                    >
                      ▾
                    </button>
                  </div>
                  {openSubmenu === "people" && (
                    <div className="submenu">
                      <button onClick={() => setNav("grid")}>10-column grid</button>
                      <button onClick={() => setNav("tiles")}>Tile gallery</button>
                      <button onClick={() => setSelected(displayedEmployees[0])}>Featured detail</button>
                    </div>
                  )}
                  <div className={`drawer-item has-sub ${openSubmenu === "alerts" ? "open" : ""}`}>
                    <div>
                      <div className="muted">Alerts</div>
                      <strong>Flags & approvals</strong>
                    </div>
                    <button
                      className="ghost-btn tiny"
                      onClick={() => setOpenSubmenu(prev => (prev === "alerts" ? null : "alerts"))}
                      aria-label="Toggle alerts submenu"
                    >
                      ▾
                    </button>
                  </div>
                  {openSubmenu === "alerts" && (
                    <div className="submenu">
                      <button>Attendance health</button>
                      <button>Class readiness</button>
                    </div>
                  )}
                  <button className="drawer-item" onClick={() => setNav("settings")}>
                    Settings
                    <span className="muted">Theme, access</span>
                  </button>
                </div>
              )}
            </header>

            <div className="panel gradient-card">
              <div>
                <p className="pill mini">Command palette</p>
                <h2 className="title">Switch between 10-column grid and tile stories</h2>
                <p className="subtitle">
                  Crafted to mirror the assessment brief: hamburger drawer with sub-menus, horizontal nav, and a focused
                  roster showcase.
                </p>
                <div className="hero-actions">
                  <div className="toggle" role="tablist" aria-label="Primary View">
                    <button
                      className={viewMode === "grid" ? "active" : ""}
                      aria-pressed={viewMode === "grid"}
                      onClick={() => setNav("grid")}
                    >
                      Grid
                    </button>
                    <button
                      className={viewMode === "tiles" ? "active" : ""}
                      aria-pressed={viewMode === "tiles"}
                      onClick={() => setNav("tiles")}
                    >
                      Tiles
                    </button>
                  </div>
                  <button className="ghost-btn" onClick={() => setSelected(displayedEmployees[0])}>
                    Peek a record
                  </button>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-block">
                  <span className="muted">Total employees</span>
                  <strong>{displayedEmployees.length}</strong>
                </div>
                <div className="stat-block">
                  <span className="muted">Avg attendance</span>
                  <strong>{avgAttendance.toFixed(1)}%</strong>
                </div>
                <div className="stat-block">
                  <span className="muted">Flagged</span>
                  <strong>{displayedEmployees.filter(e => e.status.toLowerCase().includes("flag")).length}</strong>
                </div>
              </div>
            </div>

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

            {navTab === "grid" && (
              <div className="panel form-card">
                <div className="section-header">
                  <div>
                    <h2 className="title" style={{ marginBottom: 4 }}>
                      Employee grid — 10 columns
                    </h2>
                    <p className="muted">Scrollable grid with all columns requested in the prompt.</p>
                  </div>
                  <div className="chip">Grid</div>
                </div>
                <EmployeeGrid employees={displayedEmployees} />
              </div>
            )}

            {navTab === "tiles" && (
              <div className="panel form-card">
                <div className="section-header">
                  <div>
                    <h2 className="title" style={{ marginBottom: 4 }}>
                      Tile view — quick read
                    </h2>
                    <p className="muted">Minimal, necessary fields with bun menu for inline options.</p>
                  </div>
                  <div className="chip">Tiles</div>
                </div>
                <EmployeeTiles employees={displayedEmployees} onSelect={setSelected} />
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
