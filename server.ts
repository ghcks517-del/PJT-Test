import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const DB_PATH = path.join(process.cwd(), "data.json");

// 초기 데이터
const initialDb = {
  projects: ['A 신축공사 현장', 'B 제조 공장 증설', 'C 도심형 오피스'],
  contractors: ['대건설(주)', '우진토건', '안전기술테크', '동방시스템'],
  results: [],
  admins: [{ id: 'admin', password: '0000' }]
};

// 데이터 로드
function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch (e) {
      console.error("Error loading DB, using defaults", e);
      return initialDb;
    }
  }
  return initialDb;
}

// 데이터 저장
function saveDb(db: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error saving DB", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let db = loadDb();

  // --- API 엔드포인트 ---

  // PJT 및 업체 정보 가져오기
  app.get("/api/meta", (req, res) => {
    const currentDb = loadDb();
    res.json({ projects: currentDb.projects, contractors: currentDb.contractors });
  });

  // 프로젝트 추가
  app.post("/api/meta/projects", (req, res) => {
    const currentDb = loadDb();
    const { name } = req.body;
    if (name && !currentDb.projects.includes(name)) {
      currentDb.projects.push(name);
      saveDb(currentDb);
      return res.status(201).json({ projects: currentDb.projects });
    }
    res.status(400).json({ error: "Invalid name" });
  });

  // 프로젝트 삭제
  app.delete("/api/meta/projects/:name", (req, res) => {
    const currentDb = loadDb();
    const { name } = req.params;
    currentDb.projects = currentDb.projects.filter((p: string) => p !== name);
    saveDb(currentDb);
    res.json({ projects: currentDb.projects });
  });

  // 업체 추가
  app.post("/api/meta/contractors", (req, res) => {
    const currentDb = loadDb();
    const { name } = req.body;
    if (name && !currentDb.contractors.includes(name)) {
      currentDb.contractors.push(name);
      saveDb(currentDb);
      return res.status(201).json({ contractors: currentDb.contractors });
    }
    res.status(400).json({ error: "Invalid name" });
  });

  // 업체 삭제
  app.delete("/api/meta/contractors/:name", (req, res) => {
    const currentDb = loadDb();
    const { name } = req.params;
    currentDb.contractors = currentDb.contractors.filter((c: string) => c !== name);
    saveDb(currentDb);
    res.json({ contractors: currentDb.contractors });
  });

  // 시험 결과 제출
  app.post("/api/results", (req, res) => {
    const currentDb = loadDb();
    const newResult = {
      id: Date.now().toString(),
      ...req.body,
      submittedAt: new Date().toISOString()
    };
    if (!currentDb.results) {
      currentDb.results = [];
    }
    currentDb.results.push(newResult);
    saveDb(currentDb);
    res.status(201).json(newResult);
  });

  // 결과 목록 조회 (관리자용)
  app.get("/api/results", (req, res) => {
    const currentDb = loadDb();
    const results = currentDb.results || [];
    res.json(results.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
  });

  // 교육 수료일자 수정
  app.patch("/api/results/:id", (req, res) => {
    const currentDb = loadDb();
    const { id } = req.params;
    const { trainingDate } = req.body;
    const results = currentDb.results || [];
    const index = results.findIndex((r: any) => r.id === id);
    if (index !== -1) {
      results[index].trainingDate = trainingDate;
      saveDb(currentDb);
      return res.json(results[index]);
    }
    res.status(404).json({ error: "Not found" });
  });

  // 결과 삭제
  app.delete("/api/results/:id", (req, res) => {
    const currentDb = loadDb();
    const { id } = req.params;
    currentDb.results = (currentDb.results || []).filter((r: any) => r.id !== id);
    saveDb(currentDb);
    res.status(204).end();
  });

  // --- Vite 미들웨어 설정 ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
