CREATE TABLE IF NOT EXISTS t_p33712990_data_analysis_initia.employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT '',
  benefit TEXT NOT NULL DEFAULT '',
  days_off TEXT NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p33712990_data_analysis_initia.employee_tasks (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE t_p33712990_data_analysis_initia.business_tasks ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
