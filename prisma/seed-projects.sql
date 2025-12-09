-- Create default projects for all users
-- This is a one-time migration script

-- Insert default projects
-- Note: You'll need to replace USER_ID with your actual user ID from the database

INSERT INTO "Project" (id, "userId", name, description, color, icon, "sortOrder", "isArchived", "createdAt", "updatedAt")
VALUES 
  ('work', 'USER_ID', 'Work', NULL, '#2563eb', 'briefcase', 0, false, NOW(), NOW()),
  ('health', 'USER_ID', 'Health & Fitness', NULL, '#059669', 'dumbbell', 1, false, NOW(), NOW()),
  ('learning', 'USER_ID', 'Learning', NULL, '#7c3aed', 'book', 2, false, NOW(), NOW()),
  ('personal', 'USER_ID', 'Personal', NULL, '#ec4899', 'heart', 3, false, NOW(), NOW()),
  ('home', 'USER_ID', 'Home', NULL, '#f59e0b', 'home', 4, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
