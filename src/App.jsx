import { useEffect, useRef, useState } from "react";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

function App() {
  const [students, setStudents] = useState(() => read("qb_students"));
  const [quizzes, setQuizzes] = useState(() => read("qb_quizzes"));
  const [results, setResults] = useState(() => read("qb_results"));
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizMinutes, setQuizMinutes] = useState("");
  const [kind, setKind] = useState("mcq");
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState("1");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("A");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const finishing = useRef(false);
  const scoreRef = useRef(0);

  useEffect(() => localStorage.setItem("qb_students", JSON.stringify(students)), [students]);
  useEffect(() => localStorage.setItem("qb_quizzes", JSON.stringify(quizzes)), [quizzes]);
  useEffect(() => localStorage.setItem("qb_results", JSON.stringify(results)), [results]);

  const finishQuiz = (finalScore = scoreRef.current) => {
    if (finishing.current || !activeQuiz || !user) return;
    finishing.current = true;
    setResults((old) => [
      ...old,
      {
        id: `${Date.now()}-${Math.random()}`,
        studentId: user.studentId,
        name: user.name,
        username: user.username,
        quiz: activeQuiz.title,
        obtained: finalScore,
        totalMarks: activeQuiz.totalMarks,
        date: new Date().toLocaleDateString(),
      },
    ]);
    setActiveQuiz(null);
    setNotice(`Quiz finished. Your score: ${finalScore} marks.`);
    setPage("student");
  };

  useEffect(() => {
    if (page !== "play" || !activeQuiz) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((left) => Math.max(0, left - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [page, activeQuiz]);

  useEffect(() => {
    if (page === "play" && activeQuiz && secondsLeft === 0) finishQuiz();
  }, [page, activeQuiz, secondsLeft]);

  const signup = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const studentId = data.get("studentId").trim();
    const name = data.get("name").trim();
    const username = data.get("username").trim();
    const password = data.get("password");
    if (students.some((student) => student.studentId.toLowerCase() === studentId.toLowerCase()
      || student.username.toLowerCase() === username.toLowerCase())) {
      setNotice("That Student ID or username is already registered.");
      return;
    }
    setStudents((old) => [...old, { studentId, name, username, password }]);
    setNotice("Account created. You can now log in.");
    setPage("studentLogin");
  };

  const login = (event, role) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = data.get("username").trim();
    const password = data.get("password");

    if (role === "admin") {
      if (username !== "admin" || password !== "admin123") {
        setNotice("Admin login was not correct.");
        return;
      }
      setUser({ role: "admin", username: "admin" });
      setNotice("");
      setPage("admin");
      return;
    }

    const student = students.find((item) => item.username.toLowerCase() === username.toLowerCase()
      && item.password === password);
    if (!student) {
      setNotice("Username or password is not correct. Sign up if you are new.");
      return;
    }
    setUser({ ...student, role: "student" });
    setNotice("");
    setPage("student");
  };

  const addQuestion = () => {
    const points = Number(marks);
    if (!question.trim() || !Number.isFinite(points) || points <= 0) {
      setNotice("Enter a question and marks greater than zero.");
      return;
    }
    let correct = answer.trim();
    if (kind === "mcq") {
      if (options.some((option) => !option.trim())) {
        setNotice("Fill in all four choices.");
        return;
      }
      correct = correct.toUpperCase();
    } else if (kind === "fill") {
      correct = correct.toLowerCase();
    }
    setDraft((old) => [...old, {
      type: kind,
      question: question.trim(),
      marks: points,
      options: kind === "mcq" ? options.map((option) => option.trim()) : [],
      answer: correct,
    }]);
    setQuestion("");
    setMarks("1");
    setOptions(["", "", "", ""]);
    setAnswer(kind === "mcq" ? "A" : "");
    setNotice("Question added to your draft.");
  };

  const saveQuiz = (event) => {
    event.preventDefault();
    const minutes = Number(quizMinutes);
    if (!quizTitle.trim() || !Number.isFinite(minutes) || minutes <= 0 || !draft.length) {
      setNotice("Add a title, a time limit, and at least one question.");
      return;
    }
    const newQuiz = {
      id: `${Date.now()}-${Math.random()}`,
      title: quizTitle.trim(),
      time: minutes,
      totalMarks: draft.reduce((sum, item) => sum + item.marks, 0),
      questions: draft,
    };
    setQuizzes((old) => [...old, newQuiz]);
    setQuizTitle("");
    setQuizMinutes("");
    setDraft([]);
    setNotice("Quiz saved. Students can now take it.");
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setQuestionIndex(0);
    setSelected("");
    setScore(0);
    scoreRef.current = 0;
    setSecondsLeft(quiz.time * 60);
    finishing.current = false;
    setNotice("");
    setPage("play");
  };

  const submitAnswer = (event) => {
    event.preventDefault();
    const current = activeQuiz.questions[questionIndex];
    if (!selected.trim()) {
      setNotice("Choose or enter an answer first.");
      return;
    }
    const correct = current.type === "fill"
      ? selected.trim().toLowerCase() === current.answer.trim().toLowerCase()
      : selected === current.answer;
    const nextScore = score + (correct ? current.marks : 0);
    setScore(nextScore);
    scoreRef.current = nextScore;
    setSelected("");
    setNotice("");
    if (questionIndex + 1 >= activeQuiz.questions.length) {
      finishQuiz(nextScore);
    } else {
      setQuestionIndex((index) => index + 1);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveQuiz(null);
    setPage("login");
    setNotice("");
  };

  const visibleResults = user?.role === "admin"
    ? results
    : results.filter((result) => result.username === user?.username);
  const currentQuestion = activeQuiz?.questions[questionIndex];
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">Q</span> Quiz Builder</div>
        {user && <div className="signed-in">Signed in as <b>{user.role === "admin" ? "Admin" : user.name}</b></div>}
      </header>
      <main className="shell">
        <div className="intro">
          <p className="eyebrow">LEARN · PRACTICE · REVIEW</p>
          <h1>{page === "play" ? "Focus on one question at a time." : "A little practice goes a long way."}</h1>
          <p className="subtitle">Build quizzes, test your knowledge, and keep track of your progress.</p>
        </div>

        {notice && <div className="notice" role="status">{notice}</div>}

        {page === "login" && (
          <section className="panel auth-panel">
            <div className="panel-heading"><span className="icon">↗</span><div><h2>Welcome back</h2><p>Choose your account type to continue.</p></div></div>
            <form className="auth-grid" onSubmit={(event) => login(event, "admin")}>
              <h3>Admin login</h3>
              <Field label="Username" name="username" placeholder="admin" required />
              <Field label="Password" name="password" type="password" placeholder="Enter password" required />
              <button className="button primary" type="submit">Sign in as admin <span>→</span></button>
              <p className="hint">Demo account: admin / admin123</p>
            </form>
            <div className="divider"><span>OR</span></div>
            <div className="student-entry">
              <div><h3>Are you a student?</h3><p>Log in or make a free account to take quizzes.</p></div>
              <div className="button-row">
                <button className="button secondary" onClick={() => { setNotice(""); setPage("studentLogin"); }}>Student login</button>
                <button className="button plain" onClick={() => { setNotice(""); setPage("signup"); }}>Create account</button>
              </div>
            </div>
          </section>
        )}

        {page === "signup" && (
          <section className="panel narrow">
            <SectionTitle label="STUDENT ACCOUNT" title="Create your account" detail="Your details stay in this browser for this demo." />
            <form className="form-stack" onSubmit={signup}>
              <Field label="Student ID" name="studentId" placeholder="e.g. 240001" required />
              <Field label="Full name" name="name" placeholder="Your name" required />
              <Field label="Username" name="username" placeholder="Choose a username" required />
              <Field label="Password" name="password" type="password" placeholder="Choose a password" required minLength={4} />
              <button className="button primary" type="submit">Create student account <span>→</span></button>
            </form>
            <button className="back-link" onClick={() => { setNotice(""); setPage("login"); }}>← Back to login</button>
          </section>
        )}

        {page === "studentLogin" && (
          <section className="panel narrow">
            <SectionTitle label="STUDENT AREA" title="Student login" detail="Sign in to see available quizzes and your scores." />
            <form className="form-stack" onSubmit={(event) => login(event, "student")}>
              <Field label="Username" name="username" placeholder="Your username" required />
              <Field label="Password" name="password" type="password" placeholder="Your password" required />
              <button className="button primary" type="submit">Sign in as student <span>→</span></button>
            </form>
            <button className="back-link" onClick={() => { setNotice(""); setPage("login"); }}>← Back to login</button>
          </section>
        )}

        {page === "admin" && (
          <section className="panel">
            <SectionTitle label="ADMIN MODULE" title="Quiz studio" detail="Create a quiz, add questions, and review student scores." />
            <div className="admin-layout">
              <form className="form-stack" onSubmit={saveQuiz}>
                <h3 className="form-title">New quiz</h3>
                <Field label="Quiz title" value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} placeholder="e.g. Biology basics" required />
                <Field label="Time limit (minutes)" type="number" min="1" value={quizMinutes} onChange={(event) => setQuizMinutes(event.target.value)} placeholder="10" required />
                <div className="form-divider" />
                <h3 className="form-title">Add a question</h3>
                <label className="field"><span>Question type</span><select value={kind} onChange={(event) => { setKind(event.target.value); setAnswer(event.target.value === "mcq" ? "A" : event.target.value === "tf" ? "True" : ""); }}><option value="mcq">Multiple choice</option><option value="tf">True or false</option><option value="fill">Fill in the blank</option></select></label>
                <Field label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Write the question" required />
                <Field label="Marks" type="number" min="1" value={marks} onChange={(event) => setMarks(event.target.value)} required />
                {kind === "mcq" && (
                  <>
                    <div className="choice-grid">{options.map((option, index) => <Field key={index} label={`Choice ${String.fromCharCode(65 + index)}`} value={option} onChange={(event) => setOptions((old) => old.map((item, i) => i === index ? event.target.value : item))} placeholder={`Option ${String.fromCharCode(65 + index)}`} required />)}</div>
                    <label className="field"><span>Correct choice</span><select value={answer} onChange={(event) => setAnswer(event.target.value)}>{["A", "B", "C", "D"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  </>
                )}
                {kind === "tf" && <label className="field"><span>Correct answer</span><select value={answer || "True"} onChange={(event) => setAnswer(event.target.value)}><option>True</option><option>False</option></select></label>}
                {kind === "fill" && <Field label="Correct answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the answer" required />}
                <button className="button secondary" type="button" onClick={addQuestion}>+ Add question to draft</button>
                <button className="button primary" type="submit">Save quiz <span>→</span></button>
              </form>
              <aside className="draft-box">
                <div className="draft-head"><div><p className="eyebrow">CURRENT DRAFT</p><h3>{quizTitle || "Untitled quiz"}</h3></div><span className="count">{draft.length}</span></div>
                {draft.length ? draft.map((item, index) => <div className="draft-item" key={`${item.question}-${index}`}><span>Q{index + 1}</span><div>{item.question}<small>{item.type === "mcq" ? "Multiple choice" : item.type === "tf" ? "True or false" : "Fill in"} · {item.marks} mark{item.marks === 1 ? "" : "s"}</small></div></div>) : <div className="empty small-empty">Questions you add appear here.</div>}
                <div className="draft-total">Total marks <b>{draft.reduce((sum, item) => sum + item.marks, 0)}</b></div>
              </aside>
            </div>
            <div className="section-rule" />
            <SectionTitle label="SAVED QUIZZES" title="Your quiz library" detail={`${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"} ready for students.`} />
            <QuizCards quizzes={quizzes} />
            <div className="section-rule" />
            <SectionTitle label="STUDENT ACTIVITY" title="Result history" detail="Scores submitted by students." />
            <ResultList results={visibleResults} />
            <button className="button plain logout" onClick={logout}>Sign out</button>
          </section>
        )}

        {page === "student" && (
          <section className="panel">
            <SectionTitle label="STUDENT MODULE" title={`Ready to practice, ${user?.name}?`} detail="Choose a quiz below. Your results will be saved here." />
            <div className="stats-row"><div className="stat"><strong>{quizzes.length}</strong><span>Available quizzes</span></div><div className="stat"><strong>{visibleResults.length}</strong><span>Quizzes completed</span></div><div className="stat"><strong>{visibleResults.length ? Math.max(...visibleResults.map((item) => item.obtained)) : 0}</strong><span>Best score</span></div></div>
            <div className="section-rule" />
            <SectionTitle label="PICK A QUIZ" title="Available quizzes" detail="Take your time and do your best." />
            <QuizCards quizzes={quizzes} onStart={startQuiz} />
            <div className="section-rule" />
            <SectionTitle label="YOUR PROGRESS" title="Recent results" detail="Your submitted quiz scores." />
            <ResultList results={visibleResults} />
            <button className="button plain logout" onClick={logout}>Sign out</button>
          </section>
        )}

        {page === "play" && activeQuiz && currentQuestion && (
          <section className="panel quiz-panel">
            <div className="quiz-top"><div><p className="eyebrow">PRACTICE QUIZ</p><h2>{activeQuiz.title}</h2></div><div className={`timer ${secondsLeft < 60 ? "urgent" : ""}`}><span>TIME LEFT</span><b>{time}</b></div></div>
            <div className="progress-label"><span>Question {questionIndex + 1} of {activeQuiz.questions.length}</span><span>{currentQuestion.marks} mark{currentQuestion.marks === 1 ? "" : "s"}</span></div>
            <div className="progress"><span style={{ width: `${((questionIndex + 1) / activeQuiz.questions.length) * 100}%` }} /></div>
            <form onSubmit={submitAnswer}>
              <h2 className="question-title">{currentQuestion.question}</h2>
              {currentQuestion.type === "mcq" && <div className="answers">{currentQuestion.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                return <button className={`answer ${selected === letter ? "selected" : ""}`} type="button" key={letter} onClick={() => setSelected(letter)}><span className="answer-letter">{letter}</span>{option}</button>;
              })}</div>}
              {currentQuestion.type === "tf" && <div className="answers two">{["True", "False"].map((value) => <button className={`answer ${selected === value ? "selected" : ""}`} type="button" key={value} onClick={() => setSelected(value)}><span className="answer-letter">{value === "True" ? "T" : "F"}</span>{value}</button>)}</div>}
              {currentQuestion.type === "fill" && <Field label="Your answer" value={selected} onChange={(event) => setSelected(event.target.value)} placeholder="Type your answer" autoFocus />}
              <button className="button primary next-button" type="submit">{questionIndex + 1 === activeQuiz.questions.length ? "Finish quiz" : "Next question"} <span>→</span></button>
            </form>
            <button className="back-link" onClick={() => { setActiveQuiz(null); setPage("student"); setNotice("Quiz ended without submitting."); }}>Exit quiz</button>
          </section>
        )}
      </main>
      <footer>Quiz Builder <span>·</span> Simple tools for better practice</footer>
    </>
  );
}

function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

function SectionTitle({ label, title, detail }) {
  return <div className="section-title"><p className="eyebrow">{label}</p><h2>{title}</h2><p>{detail}</p></div>;
}

function QuizCards({ quizzes, onStart }) {
  if (!quizzes.length) return <div className="empty"><span className="empty-icon">✳</span><h3>No quizzes yet</h3><p>Check back when your admin has added a quiz.</p></div>;
  return <div className="quiz-grid">{quizzes.map((quiz) => <article className="quiz-card" key={quiz.id}><div className="quiz-card-icon">Q.</div><p className="eyebrow">QUIZ</p><h3>{quiz.title}</h3><div className="quiz-meta"><span>{quiz.questions.length} questions</span><span>{quiz.time} min</span><span>{quiz.totalMarks} marks</span></div>{onStart && <button className="button primary" onClick={() => onStart(quiz)}>Start quiz <span>→</span></button>}</article>)}</div>;
}

function ResultList({ results }) {
  if (!results.length) return <div className="empty"><p>No results to show yet.</p></div>;
  return <div className="results">{[...results].reverse().map((result) => <div className="result-row" key={result.id}><div className="result-icon">✓</div><div className="result-info"><b>{result.quiz}</b><span>{result.name} · {result.date}</span></div><strong>{result.obtained}<small> / {result.totalMarks}</small></strong></div>)}</div>;
}

export default App;
