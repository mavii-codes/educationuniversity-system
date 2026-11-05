ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users
SET role = 'Library Staff',
    department = CASE
      WHEN department = 'Office of the University Registrar' THEN 'Library Services'
      ELSE department
    END
WHERE role = 'University Registrar Admin';

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN (
    'System Administrator',
    'Library Staff',
    'Data Integration Engineer',
    'Institutional Data Steward',
    'Student'
  ));
