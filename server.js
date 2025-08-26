const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');

const app = express();
// 兼容旧库：是否存在 communities.district 非空列
let COMMUNITIES_HAS_DISTRICT = false;
app.set('trust proxy', true);
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 15 // 最多15个文件
  },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));
// 提供上传文件的静态访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 限流中间件
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15分钟
//   max: 100 // 限制每个IP 15分钟内最多100个请求
// });
// app.use('/api/', limiter);

// 数据库初始化
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.serialize(() => {
    // 管理员表
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 组/排/小区/大区/召会表
    db.run(`CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'group'/'pai'/'community'/'region'/'church'
      project TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 迁移：为已存在的 communities 表补充缺失的 project 列，然后再进行后续操作
    db.all("PRAGMA table_info(communities)", (err, columns) => {
      let hasDistrict = false;
      const proceed = () => {
        // 聚会记录表 - 检查并迁移表结构
        db.all("PRAGMA table_info(meetings)", (meetingErr, meetingColumns) => {
          if (meetingErr || !meetingColumns || meetingColumns.length === 0) {
            // 表不存在，创建新表
            db.run(`CREATE TABLE IF NOT EXISTS meetings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project TEXT NOT NULL,
              community_type TEXT NOT NULL,
              meeting_date DATE NOT NULL,
              meeting_time TEXT NOT NULL,
              location TEXT NOT NULL,
              participants_count INTEGER DEFAULT 0,
              notes TEXT,
              created_by INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES admins (id)
            )`);
          } else {
            // 检查是否需要迁移
            const hasProject = meetingColumns.some(col => col.name === 'project');
            const hasCommunityType = meetingColumns.some(col => col.name === 'community_type');
            const hasCommunityId = meetingColumns.some(col => col.name === 'community_id');
            
            if (!hasProject || !hasCommunityType) {
              // 需要迁移表结构
              console.log('开始迁移meetings表结构...');
              
              // 1. 创建新表
              db.run(`CREATE TABLE IF NOT EXISTS meetings_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project TEXT NOT NULL,
                community_type TEXT NOT NULL,
                meeting_date DATE NOT NULL,
                meeting_time TEXT NOT NULL,
                location TEXT NOT NULL,
                participants_count INTEGER DEFAULT 0,
                notes TEXT,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admins (id)
              )`, (createErr) => {
                if (createErr) {
                  console.error('创建新meetings表失败:', createErr);
                  return;
                }
                
                if (hasCommunityId) {
                  // 2. 迁移旧数据
                  db.all(`
                    SELECT m.*, c.project, c.type as community_type 
                    FROM meetings m 
                    LEFT JOIN communities c ON m.community_id = c.id
                  `, (selectErr, oldRows) => {
                    if (selectErr) {
                      console.error('读取旧数据失败:', selectErr);
                      return;
                    }
                    
                    if (oldRows && oldRows.length > 0) {
                      const insertPromises = oldRows.map(row => {
                        return new Promise((resolve, reject) => {
                          db.run(`
                            INSERT INTO meetings_new (
                              project, community_type, meeting_date, meeting_time, 
                              location, participants_count, notes, created_by, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                          `, [
                            row.project || '1', 
                            row.community_type || 'group',
                            row.meeting_date,
                            row.meeting_time,
                            row.location,
                            row.participants_count,
                            row.notes,
                            row.created_by,
                            row.created_at,
                            row.updated_at
                          ], (insertErr) => {
                            if (insertErr) reject(insertErr);
                            else resolve();
                          });
                        });
                      });
                      
                      Promise.all(insertPromises).then(() => {
                        // 3. 删除旧表，重命名新表
                        db.run('DROP TABLE meetings', (dropErr) => {
                          if (dropErr) {
                            console.error('删除旧表失败:', dropErr);
                            return;
                          }
                          db.run('ALTER TABLE meetings_new RENAME TO meetings', (renameErr) => {
                            if (renameErr) {
                              console.error('重命名表失败:', renameErr);
                            } else {
                              console.log('meetings表迁移完成');
                            }
                          });
                        });
                      }).catch(err => {
                        console.error('数据迁移失败:', err);
                      });
                    } else {
                      // 没有旧数据，直接替换表
                      db.run('DROP TABLE meetings', () => {
                        db.run('ALTER TABLE meetings_new RENAME TO meetings', () => {
                          console.log('meetings表结构更新完成');
                        });
                      });
                    }
                  });
                } else {
                  // 没有旧的community_id字段，直接替换
                  db.run('DROP TABLE meetings', () => {
                    db.run('ALTER TABLE meetings_new RENAME TO meetings', () => {
                      console.log('meetings表结构更新完成');
                    });
                  });
                }
              });
            }
          }
        });

        // 插入默认管理员账户
        db.get("SELECT id FROM admins WHERE username = 'admin'", (err2, row) => {
          if (!row) {
            const defaultPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)`,
              ['admin', defaultPassword, '系统管理员', 'super_admin']);
            console.log('默认管理员账户已创建: admin/admin123');
          }
        });

        // 插入10个项目（名字为1~10）
        db.get("SELECT COUNT(*) as count FROM communities", (err3, row2) => {
          if (row2 && row2.count === 0) {
            for (let i = 1; i <= 10; i++) {
              if (hasDistrict) {
                db.run(`INSERT INTO communities (name, type, project, district) VALUES (?, ?, ?, ?)`, [
                  `示例${i}组`, 'group', `${i}`, ''
                ]);
              } else {
                db.run(`INSERT INTO communities (name, type, project) VALUES (?, ?, ?)`, [
                  `示例${i}组`, 'group', `${i}`
                ]);
              }
            }
            console.log('已插入10个示例组，项目名为1~10');
          }
        });
      };

      if (!err && Array.isArray(columns)) {
        hasDistrict = columns.some(col => col.name === 'district');
        COMMUNITIES_HAS_DISTRICT = hasDistrict;
        const hasProject = columns.some(col => col.name === 'project');
        if (!hasProject) {
          db.run("ALTER TABLE communities ADD COLUMN project TEXT NOT NULL DEFAULT '1'", alterErr => {
            if (alterErr) {
              console.error('为 communities 添加 project 列失败:', alterErr.message);
              // 即使失败也尝试继续，避免服务完全不可用
            } else {
              console.log("已为 communities 表添加缺失的 'project' 列，默认值为 '1'");
            }
            proceed();
          });
        } else {
          proceed();
        }
      } else {
        proceed();
      }
    });
  });
}

// 身份验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
}

// 管理员登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  });
});

// 获取组/排/小区/大区/召会列表
app.get('/api/communities', authenticateToken, (req, res) => {
  db.all('SELECT * FROM communities ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(rows);
  });
});

// 添加组/排/小区/大区/召会
app.post('/api/communities', authenticateToken, (req, res) => {
  const { name, type, project } = req.body;
  if (!name || !type || !project) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  // 仅允许五种类型
  const allowedTypes = ['group','pai','community','region','church'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: '类型不合法' });
  }
  const insertSql = COMMUNITIES_HAS_DISTRICT
    ? 'INSERT INTO communities (name, type, project, district) VALUES (?, ?, ?, ?)'
    : 'INSERT INTO communities (name, type, project) VALUES (?, ?, ?)';
  const params = COMMUNITIES_HAS_DISTRICT
    ? [name, type, project, '']
    : [name, type, project];
  db.run(insertSql,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ id: this.lastID, message: '添加成功' });
    });
});

// 删除组/排/小区/大区/召会
app.delete('/api/communities/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM communities WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({ message: '项目删除成功' });
  });
});

// 更新组/排/小区/大区/召会
app.put('/api/communities/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, type, project } = req.body;

  if (!name || !type || !project) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }

  const allowedTypes = ['group','pai','community','region','church'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: '类型不合法' });
  }

  const updateSql = COMMUNITIES_HAS_DISTRICT
    ? `UPDATE communities SET name = ?, type = ?, project = ?, district = COALESCE(district, '') WHERE id = ?`
    : `UPDATE communities SET name = ?, type = ?, project = ? WHERE id = ?`;
  const params = COMMUNITIES_HAS_DISTRICT
    ? [name, type, project, id]
    : [name, type, project, id];
  db.run(updateSql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json({ message: '更新成功' });
  });
});

// 获取聚会记录列表
app.get('/api/meetings', authenticateToken, (req, res) => {
  const { project, community_type, start_date, end_date, location } = req.query;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const offset = (page - 1) * limit;

  let query = `
    SELECT m.*, a.name as created_by_name
    FROM meetings m
    JOIN admins a ON m.created_by = a.id
  `;
  
  let params = [];
  let whereConditions = [];

  if (project) {
    whereConditions.push('m.project = ?');
    params.push(project);
  }

  if (community_type) {
    whereConditions.push('m.community_type = ?');
    params.push(community_type);
  }

  if (start_date) {
    whereConditions.push('m.meeting_date >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('m.meeting_date <= ?');
    params.push(end_date);
  }

  if (location) {
    whereConditions.push('m.location LIKE ?');
    params.push(`%${location}%`);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY m.meeting_date DESC, m.meeting_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    // 获取总记录数
    let countQuery = `
      SELECT COUNT(*) as total FROM meetings m
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    db.get(countQuery, params.slice(0, -2), (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      res.json({
        meetings: rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(countRow.total / limit),
          total_records: countRow.total,
          limit: limit
        }
      });
    });
  });
});

// 获取单条聚会记录详情
app.get('/api/meetings/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      m.*, 
      a.name as created_by_name
    FROM meetings m
    JOIN admins a ON m.created_by = a.id
    WHERE m.id = ?
  `;
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!row) {
      return res.status(404).json({ error: '聚会记录不存在' });
    }
    res.json(row);
  });
});

// 添加聚会记录
app.post('/api/meetings', authenticateToken, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 10 }
]), (req, res) => {
  const { project, community_type, meeting_date, meeting_time, location, participants_count, notes } = req.body;

  if (!project || !community_type || !meeting_date || !meeting_time) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  db.run(`
    INSERT INTO meetings (project, community_type, meeting_date, meeting_time, location, participants_count, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [project, community_type, meeting_date, meeting_time, (location || ''), participants_count || 0, notes, req.user.id],
  function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    const meetingId = this.lastID;
    
    // 处理上传的文件
    if (req.files) {
      const fileRecords = [];
      
      if (req.files.images) {
        req.files.images.forEach(file => {
          fileRecords.push([meetingId, file.filename, 'image', file.originalname, file.size]);
        });
      }
      
      if (req.files.files) {
        req.files.files.forEach(file => {
          fileRecords.push([meetingId, file.filename, 'file', file.originalname, file.size]);
        });
      }
      
      if (fileRecords.length > 0) {
        db.run(`CREATE TABLE IF NOT EXISTS meeting_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meeting_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          type TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (meeting_id) REFERENCES meetings (id)
        )`);
        
        const placeholders = fileRecords.map(() => '(?, ?, ?, ?, ?)').join(',');
        const values = fileRecords.flat();
        
        db.run(`INSERT INTO meeting_files (meeting_id, filename, type, original_name, file_size) VALUES ${placeholders}`, values);
      }
    }
    
    res.json({ id: meetingId, message: '聚会记录添加成功' });
  });
});

// 更新聚会记录（支持附件）
app.put('/api/meetings/:id', authenticateToken, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 10 }
]), (req, res) => {
  const { id } = req.params;
  const { project, community_type, meeting_date, meeting_time, location } = req.body;
  const participants_count = req.body.participants_count ? parseInt(req.body.participants_count, 10) : 0;
  const notes = req.body.notes || '';

  if (!project || !community_type || !meeting_date || !meeting_time) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  db.run(`
    UPDATE meetings 
    SET project = ?, community_type = ?, meeting_date = ?, meeting_time = ?, location = ?, 
        participants_count = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [project, community_type, meeting_date, meeting_time, (location || ''), participants_count || 0, notes, id],
  function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '聚会记录不存在' });
    }

    // 追加新上传的文件到 meeting_files
    if (req.files && (req.files.images || req.files.files)) {
      db.run(`CREATE TABLE IF NOT EXISTS meeting_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
      )`);

      const fileRecords = [];
      if (req.files.images) {
        req.files.images.forEach(file => {
          fileRecords.push([id, file.filename, 'image', file.originalname, file.size]);
        });
      }
      if (req.files.files) {
        req.files.files.forEach(file => {
          fileRecords.push([id, file.filename, 'file', file.originalname, file.size]);
        });
      }

      if (fileRecords.length > 0) {
        const placeholders = fileRecords.map(() => '(?, ?, ?, ?, ?)').join(',');
        const values = fileRecords.flat();
        db.run(`INSERT INTO meeting_files (meeting_id, filename, type, original_name, file_size) VALUES ${placeholders}`, values);
      }
    }

    res.json({ message: '聚会记录更新成功' });
  });
});

// 删除聚会记录
app.delete('/api/meetings/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM meetings WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '聚会记录不存在' });
    }
    res.json({ message: '聚会记录删除成功' });
  });
});

// 获取统计数据
app.get('/api/statistics', authenticateToken, (req, res) => {
  const { start_date, end_date, groupBy } = req.query;

  let dateFilter = '';
  let params = [];

  if (start_date && end_date) {
    dateFilter = 'WHERE meeting_date BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  let query = '';
  let queryParams = params;

  if (groupBy === 'project') {
    query = `
      SELECT 
        m.project as project,
        '' as community_name,
        NULL as community_type,
        COUNT(m.id) as meeting_count,
        SUM(m.participants_count) as total_participants,
        AVG(m.participants_count) as avg_participants
      FROM meetings m
      ${dateFilter}
      GROUP BY m.project
      ORDER BY m.project
    `;
  } else if (groupBy === 'project_unit') {
    query = `
      SELECT 
        m.project as project,
        m.community_type as community_name,
        m.community_type as community_type,
        COUNT(m.id) as meeting_count,
        SUM(m.participants_count) as total_participants,
        AVG(m.participants_count) as avg_participants
      FROM meetings m
      ${dateFilter}
      GROUP BY m.project, m.community_type
      ORDER BY m.project, m.community_type
    `;
  } else {
    // 默认：按单位（组/排/小区/大区/召会）
    query = `
      SELECT 
        '' as project,
        m.community_type as community_name,
        m.community_type as community_type,
        COUNT(m.id) as meeting_count,
        SUM(m.participants_count) as total_participants,
        AVG(m.participants_count) as avg_participants
      FROM meetings m
      ${dateFilter}
      GROUP BY m.community_type
      ORDER BY m.community_type
    `;
  }

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(rows);
  });
});

// 获取用户信息
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, name, role, created_at FROM admins WHERE id = ?', [req.user.id], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!admin) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(admin);
  });
});

// 更新用户信息
app.put('/api/profile', authenticateToken, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '姓名不能为空' });
  }

  db.run('UPDATE admins SET name = ? WHERE id = ?', [name, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ message: '个人信息更新成功' });
  });
});

// 修改密码
app.put('/api/profile/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '当前密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6个字符' });
  }

  try {
    // 验证当前密码
    db.get('SELECT password FROM admins WHERE id = ?', [req.user.id], async (err, admin) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (!admin) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const validPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!validPassword) {
        return res.status(400).json({ error: '当前密码错误' });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      db.run('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.user.id], function(err) {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ message: '密码修改成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: '密码修改失败' });
  }
});

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
