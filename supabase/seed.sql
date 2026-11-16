-- Reference data. Run after schema.sql.
insert into job_categories (name, slug, sort_order) values
  ('Engineering', 'engineering', 1),
  ('Design', 'design', 2),
  ('Product', 'product', 3),
  ('Marketing', 'marketing', 4),
  ('Sales', 'sales', 5),
  ('Human Resources', 'human-resources', 6),
  ('Finance', 'finance', 7),
  ('Customer Support', 'customer-support', 8)
on conflict do nothing;

insert into skills (name) values
  ('JavaScript'), ('React'), ('Node.js'), ('SQL'), ('Python'), ('Figma'), ('UX Research'),
  ('Project Management'), ('Communication'), ('Recruiting'), ('Excel'), ('SEO'),
  ('Content Writing'), ('Sales'), ('Customer Service'), ('Accounting'), ('Leadership')
on conflict do nothing;
