-- Add customer GST and bank details to customers
alter table customers
  add column gst_number text,
  add column gst_name text,
  add column account_name text,
  add column account_number text,
  add column ifsc text;
