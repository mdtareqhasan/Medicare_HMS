USE medicare_hms;

-- সব table clear করো (order গুরুত্বপূর্ণ — FK constraint এর জন্য)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE test_reports;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE lab_reports;
TRUNCATE TABLE billing_invoices;
TRUNCATE TABLE medical_records;
TRUNCATE TABLE appointments;
TRUNCATE TABLE doctor_availability;
TRUNCATE TABLE profiles;
TRUNCATE TABLE medicines;
TRUNCATE TABLE lab_tests;
TRUNCATE TABLE roles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ════════════════════════════════
-- 1. USERS
-- ════════════════════════════════
INSERT INTO users (username, email, password, role) VALUES
('admin1',         'admin@medicare.com',      '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'ADMIN'),
('karim',          'karim@medicare.com',      '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'ADMIN'),
('dr.rahman',      'rahman@medicare.com',     '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'DOCTOR'),
('dr.fatema',      'fatema@medicare.com',     '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'DOCTOR'),
('dr.karim',       'dr.karim@medicare.com',     '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'DOCTOR'),
('nurse.sadia',    'sadia@medicare.com',      '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'NURSE'),
('patient.rahim',  'rahim@gmail.com',         '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PATIENT'),
('patient.nila',   'nila@gmail.com',          '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PATIENT'),
('patient.raju',   'raju@gmail.com',          '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PATIENT'),
('patient.mou',    'mou@gmail.com',           '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PATIENT'),
('patient.habib',  'habib@gmail.com',         '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PATIENT'),
('pharmacist.riya','riya@medicare.com',       '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'PHARMACIST'),
('lab.arun',       'labtech@medicare.com',    '$2a$10$slYQmyNdgTY18LGvgxPwHOIL2BpCoa6RCXRmMV5qE8HRJO8TKOVNK', 'LAB_TECHNICIAN');

-- সব password = "admin1234"

-- ════════════════════════════════
-- 2. PROFILES
-- ════════════════════════════════
INSERT INTO profiles (user_id, first_name, last_name, phone, address, date_of_birth, gender, blood_group, emergency_name, emergency_phone, emergency_relation) VALUES
(1,  'System',  'Admin',   '01711000001', 'Dhaka',           '1985-01-15', 'MALE',   'O+',  'N/A',          'N/A',          'N/A'),
(2,  'Mizanur', 'Rahman',  '01711000002', 'Dhanmondi, Dhaka','1978-03-20', 'MALE',   'B+',  'Rafiq Rahman',  '01811000002',  'Brother'),
(3,  'Fatema',  'Begum',   '01711000003', 'Gulshan, Dhaka',  '1982-07-11', 'FEMALE', 'A+',  'Kamal Begum',   '01811000003',  'Husband'),
(4,  'Abdul',   'Karim',   '01711000004', 'Chittagong',      '1975-12-05', 'MALE',   'AB+', 'Rina Karim',    '01811000004',  'Wife'),
(5,  'Sadia',   'Islam',   '01711000005', 'Mirpur, Dhaka',   '1992-04-18', 'FEMALE', 'O-',  'Faruk Islam',   '01811000005',  'Father'),
(6,  'Abdur',   'Rahim',   '01812000001', 'Comilla',         '1990-06-25', 'MALE',   'B+',  'Karim Ullah',   '01812000011',  'Father'),
(7,  'Nila',    'Akter',   '01812000002', 'Sylhet',          '1995-09-30', 'FEMALE', 'A-',  'Reza Akter',    '01812000022',  'Brother'),
(8,  'Raju',    'Ahmed',   '01812000003', 'Rajshahi',        '1988-02-14', 'MALE',   'O+',  'Mina Ahmed',    '01812000033',  'Wife'),
(9,  'Mou',     'Khatun',  '01812000004', 'Barisal',         '1993-11-22', 'FEMALE', 'AB-', 'Jalal Khatun',  '01812000044',  'Father'),
(10, 'Habib',   'Ullah',   '01812000005', 'Khulna',          '1987-08-10', 'MALE',   'B-',  'Sufia Ullah',   '01812000055',  'Mother'),
(11, 'Riya',    'Das',     '01911000001', 'Narayanganj',     '1991-05-03', 'FEMALE', 'O+',  'Rina Das',      '01911000011',  'Sister'),
(12, 'Arun',    'Lab',     '01911000002', 'Gazipur',         '1989-07-17', 'MALE',   'A+',  'Bina Lab',      '01911000022',  'Wife');

-- ════════════════════════════════
-- 3. DOCTOR AVAILABILITY
-- ════════════════════════════════
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
(2,'SATURDAY', '09:00:00','17:00:00','13:00:00','14:00:00',30,1),
(2,'SUNDAY',   '09:00:00','17:00:00','13:00:00','14:00:00',30,1),
(2,'MONDAY',   '09:00:00','17:00:00','13:00:00','14:00:00',30,1),
(2,'TUESDAY',  '09:00:00','17:00:00','13:00:00','14:00:00',30,1),
(2,'WEDNESDAY','09:00:00','17:00:00','13:00:00','14:00:00',30,1),
(2,'THURSDAY', '09:00:00','13:00:00', NULL,       NULL,      30,1),
(3,'SUNDAY',   '10:00:00','16:00:00','13:00:00','14:00:00',30,1),
(3,'MONDAY',   '10:00:00','16:00:00','13:00:00','14:00:00',30,1),
(3,'TUESDAY',  '10:00:00','16:00:00','13:00:00','14:00:00',30,1),
(3,'WEDNESDAY','10:00:00','16:00:00', NULL,       NULL,      30,1),
(4,'MONDAY',   '08:00:00','14:00:00', NULL,       NULL,      30,1),
(4,'TUESDAY',  '08:00:00','14:00:00', NULL,       NULL,      30,1),
(4,'WEDNESDAY','08:00:00','14:00:00', NULL,       NULL,      30,1),
(4,'THURSDAY', '08:00:00','14:00:00', NULL,       NULL,      30,1),
(4,'FRIDAY',   '08:00:00','12:00:00', NULL,       NULL,      30,1);

-- ════════════════════════════════
-- 4. APPOINTMENTS
-- ════════════════════════════════
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES
(6,  2, '2026-04-22 09:00:00', 'SCHEDULED',  'Fever and headache for 3 days'),
(7,  2, '2026-04-22 09:30:00', 'SCHEDULED',  'Routine checkup'),
(8,  3, '2026-04-22 10:00:00', 'SCHEDULED',  'Back pain'),
(9,  3, '2026-04-23 10:30:00', 'UPCOMING',   'Diabetes follow-up'),
(10, 4, '2026-04-23 08:00:00', 'UPCOMING',   'Blood pressure monitoring'),
(6,  4, '2026-04-19 08:00:00', 'COMPLETED',  'Cold and cough - treated'),
(7,  2, '2026-04-18 09:00:00', 'COMPLETED',  'Allergy treatment'),
(8,  3, '2026-04-17 10:00:00', 'COMPLETED',  'Eye check'),
(9,  4, '2026-04-15 08:30:00', 'CANCELLED',  'Patient cancelled'),
(10, 2, '2026-04-24 09:00:00', 'SCHEDULED',  'Chest pain follow-up'),
(6,  3, '2026-04-20 11:00:00', 'COMPLETED',  'Skin rash'),
(7,  4, '2026-04-16 08:00:00', 'COMPLETED',  'Headache and dizziness');

-- ════════════════════════════════
-- 5. MEDICAL RECORDS
-- ════════════════════════════════
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, prescription, notes, record_date) VALUES
(6,  2, 6,  'Viral fever with mild dehydration',    'Paracetamol 500mg 3x daily, ORS',         'Drink plenty of water. Rest 3 days.',          '2026-04-19'),
(7,  2, 7,  'Allergic rhinitis',                    'Cetirizine 10mg 1x daily, Nasal spray',   'Avoid dust and pollen.',                       '2026-04-18'),
(8,  3, 8,  'Myopia — short-sightedness',           'Vitamin A 1x daily',                      'Use glasses. Recheck after 1 month.',          '2026-04-17'),
(9,  4, NULL,'Type 2 Diabetes — controlled',        'Metformin 500mg 2x daily',                'Control sugar. Walk 30 min daily.',            '2026-04-15'),
(10, 4, NULL,'Hypertension Stage 1',                'Amlodipine 5mg 1x daily',                 'Low salt diet. Avoid stress.',                 '2026-04-14'),
(6,  3, 11, 'Contact dermatitis',                   'Hydrocortisone cream, Cetirizine 10mg',   'Avoid allergen. Keep skin dry.',               '2026-04-20'),
(7,  4, 12, 'Tension headache',                     'Paracetamol 500mg as needed',             'Rest, reduce screen time.',                    '2026-04-16');

-- ════════════════════════════════
-- 6. LAB TESTS (master list)
-- ════════════════════════════════
INSERT INTO lab_tests (test_name, description, cost) VALUES
('CBC (Complete Blood Count)',  'Full blood count test',               350.00),
('Blood Sugar Fasting',         'Fasting glucose level',               150.00),
('Blood Group Test',            'ABO and Rh blood group',              100.00),
('HbA1c',                       'Glycated hemoglobin for diabetes',    400.00),
('Lipid Profile',               'Cholesterol and triglyceride panel',  500.00),
('Urine R/E',                   'Routine urine examination',           120.00),
('Thyroid Profile (TSH)',       'Thyroid stimulating hormone',         600.00),
('Liver Function Test',         'SGPT, SGOT, Bilirubin panel',         700.00),
('Kidney Function Test',        'Creatinine, Urea, Uric acid',         650.00),
('Chest X-Ray',                 'PA view chest radiograph',            800.00),
('ECG',                         'Electrocardiogram 12-lead',           500.00),
('Dengue NS1 Antigen',          'Rapid dengue detection test',         800.00);

-- ════════════════════════════════
-- 7. LAB REPORTS
-- ════════════════════════════════
INSERT INTO lab_reports (patient_id, doctor_id, test_name, result, test_date) VALUES
(6,  2, 'CBC (Complete Blood Count)',  'WBC: 11.2 High, RBC: 4.5, Hgb: 13.2 — Mild infection', '2026-04-19'),
(7,  2, 'Blood Group Test',           'Blood Group: B Positive',                                '2026-04-18'),
(8,  3, 'Blood Sugar Fasting',        'Fasting glucose: 95 mg/dL — Normal range',               '2026-04-17'),
(9,  4, 'HbA1c',                      'HbA1c: 7.2% — Controlled but needs monitoring',          '2026-04-15'),
(10, 4, 'Lipid Profile',              'Total Cholesterol: 220 mg/dL Borderline High',            '2026-04-14'),
(6,  2, 'Urine R/E',                  'No abnormality detected. All values normal.',             '2026-04-19'),
(9,  3, 'Chest X-Ray',                'Clear lung fields. No consolidation seen.',               '2026-04-16'),
(10, 2, 'ECG',                        'Normal sinus rhythm. No ST segment changes.',             '2026-04-13'),
(7,  3, 'Thyroid Profile (TSH)',      'TSH: 2.1 mIU/L — Normal',                               '2026-04-18'),
(8,  4, 'Kidney Function Test',       'Creatinine: 0.9 mg/dL — Normal',                        '2026-04-17');

-- ════════════════════════════════
-- 8. TEST REPORTS (lab workflow)
-- ════════════════════════════════
INSERT INTO test_reports (patient_id, doctor_id, lab_test_id, status, result, result_url) VALUES
(6,  2, 1,  'COMPLETED', 'WBC: 11.2 High — Mild infection indicated',   NULL),
(7,  2, 3,  'COMPLETED', 'Blood Group: B Positive',                      NULL),
(8,  3, 2,  'COMPLETED', 'Fasting glucose: 95 mg/dL — Normal',          NULL),
(9,  4, 4,  'COMPLETED', 'HbA1c: 7.2% — Needs monitoring',              NULL),
(10, 4, 5,  'PENDING',    NULL,                                           NULL),
(6,  2, 6,  'PENDING',    NULL,                                           NULL),
(7,  3, 7,  'IN_PROGRESS',NULL,                                           NULL),
(8,  4, 9,  'PENDING',    NULL,                                           NULL),
(9,  2, 8,  'IN_PROGRESS',NULL,                                           NULL),
(10, 3, 11, 'PENDING',    NULL,                                           NULL);

-- ════════════════════════════════
-- 9. PRESCRIPTIONS
-- ════════════════════════════════
INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, medicines, lab_tests, notes, status) VALUES
(6,  2, 6,  '[{"name":"Paracetamol 500mg","dosage":"1+0+1","duration":"5 days"},{"name":"ORS Sachet","dosage":"1 sachet","duration":"3 days"}]',
            '["CBC (Complete Blood Count)","Urine R/E"]',
            'Drink plenty of water. Rest at home.', 'DISPENSED'),

(7,  2, 7,  '[{"name":"Cetirizine 10mg","dosage":"0+0+1","duration":"7 days"},{"name":"Fluticasone Nasal Spray","dosage":"2 puffs","duration":"14 days"}]',
            '["Thyroid Profile (TSH)"]',
            'Avoid dust and pollen. Use mask outdoors.', 'DISPENSED'),

(8,  3, 8,  '[{"name":"Vitamin A","dosage":"0+0+1","duration":"30 days"}]',
            '["Blood Sugar Fasting","Kidney Function Test"]',
            'Use corrective glasses. Recheck after 1 month.', 'PENDING'),

(9,  4, NULL,'[{"name":"Metformin 500mg","dosage":"1+0+1","duration":"30 days"},{"name":"Aspirin 75mg","dosage":"1+0+0","duration":"30 days"}]',
            '["HbA1c","Lipid Profile"]',
            'Control sugar intake. Walk 30 minutes daily.', 'DISPENSED'),

(10, 4, NULL,'[{"name":"Amlodipine 5mg","dosage":"1+0+0","duration":"30 days"}]',
            '["ECG","Lipid Profile"]',
            'Reduce salt intake. Avoid stress.', 'PENDING'),

(6,  3, 11, '[{"name":"Hydrocortisone Cream","dosage":"Apply twice","duration":"7 days"},{"name":"Cetirizine 10mg","dosage":"0+0+1","duration":"5 days"}]',
            '[]',
            'Keep skin dry. Avoid soap on affected area.', 'PENDING');

-- ════════════════════════════════
-- 10. MEDICINES
-- ════════════════════════════════
INSERT INTO medicines (name, generic_name, category, price, stock_quantity, expiry_date) VALUES
('Paracetamol 500mg',       'Paracetamol',           'Analgesic',        2.00,   500,  '2027-12-31'),
('Amoxicillin 500mg',       'Amoxicillin',           'Antibiotic',       8.00,   200,  '2027-06-30'),
('Metformin 500mg',         'Metformin',             'Antidiabetic',     5.00,   300,  '2027-12-31'),
('Amlodipine 5mg',          'Amlodipine',            'Antihypertensive', 6.00,   250,  '2027-09-30'),
('Cetirizine 10mg',         'Cetirizine',            'Antihistamine',    3.00,   400,  '2027-12-31'),
('Omeprazole 20mg',         'Omeprazole',            'Antacid',          7.00,   350,  '2027-08-31'),
('Azithromycin 500mg',      'Azithromycin',          'Antibiotic',       15.00,  150,  '2027-06-30'),
('Vitamin C 500mg',         'Ascorbic Acid',         'Supplement',       4.00,   600,  '2027-12-31'),
('ORS Sachet',              'Oral Rehydration Salt', 'Electrolyte',      1.50,  1000,  '2027-12-31'),
('Napa Extra',              'Paracetamol+Caffeine',  'Analgesic',        3.50,   450,  '2027-10-31'),
('Aspirin 75mg',            'Aspirin',               'Antiplatelet',     2.50,   300,  '2027-12-31'),
('Fluticasone Nasal Spray', 'Fluticasone',           'Corticosteroid', 180.00,    50,  '2026-12-31'),
('Insulin Regular',         'Human Insulin',         'Antidiabetic',   250.00,    80,  '2026-10-31'),
('Metronidazole 400mg',     'Metronidazole',         'Antibiotic',       5.00,   200,  '2027-06-30'),
('Calcium + D3',            'Calcium Carbonate',     'Supplement',      12.00,   400,  '2027-12-31'),
('Hydrocortisone Cream',    'Hydrocortisone',        'Topical Steroid',  25.00,   100,  '2027-06-30'),
('Vitamin A Capsule',       'Retinol',               'Supplement',       8.00,   300,  '2027-12-31');

-- ════════════════════════════════
-- 11. BILLING INVOICES
-- ════════════════════════════════
INSERT INTO billing_invoices (invoice_number, patient_id, doctor_id, doctor_fee, lab_fee, pharmacy_fee, total_amount, status) VALUES
('INV-2026-000001', 6,  2, 500.00,  350.00, 120.00,  970.00, 'PAID'),
('INV-2026-000002', 7,  2, 500.00,  150.00,  85.00,  735.00, 'PENDING'),
('INV-2026-000003', 8,  3, 600.00,  200.00,  60.00,  860.00, 'PAID'),
('INV-2026-000004', 9,  4, 700.00,  800.00, 320.00, 1820.00, 'PAID'),
('INV-2026-000005', 10, 4, 700.00,  650.00, 180.00, 1530.00, 'PENDING'),
('INV-2026-000006', 6,  3, 600.00,    0.00,  95.00,  695.00, 'OVERDUE'),
('INV-2026-000007', 7,  3, 500.00,  300.00,   0.00,  800.00, 'PENDING'),
('INV-2026-000008', 8,  4, 700.00,  450.00, 220.00, 1370.00, 'PAID');

-- ════════════════════════════════
-- 12. NOTIFICATIONS
-- ════════════════════════════════
INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
(6,  'Appointment Confirmed',    'Your appointment with Dr. Rahman on Apr 22 at 9:00 AM is confirmed.',     'INFO',    0, '/appointments'),
(7,  'Appointment Confirmed',    'Your appointment with Dr. Rahman on Apr 22 at 9:30 AM is confirmed.',     'INFO',    0, '/appointments'),
(2,  'New Appointment',          'Patient Rahim booked appointment for Apr 22 at 9:00 AM.',                 'INFO',    1, '/appointments'),
(6,  'Prescription Dispensed',   'Your prescription has been dispensed. Collect from pharmacy.',            'INFO',    1, '/pharmacy'),
(9,  'Lab Result Available',     'Your HbA1c test result is now available. Please check.',                  'INFO',    0, '/laboratory'),
(10, 'Payment Overdue',          'Invoice INV-2026-000006 is overdue. Please pay at billing counter.',      'WARNING', 0, '/billing'),
(2,  'New Patient Registered',   'New patient Habib Ullah has registered in the system.',                   'INFO',    1, '/patients'),
(3,  'Appointments Tomorrow',    'You have 2 appointments scheduled for tomorrow.',                         'INFO',    0, '/appointments'),
(11, 'Prescription Pending',     'New prescription pending dispensing for patient Nila Akter.',             'INFO',    0, '/pharmacy'),
(12, 'Lab Test Assigned',        'New CBC test assigned for patient Abdur Rahim.',                         'INFO',    0, '/laboratory'),
(8,  'Appointment Scheduled',    'Your appointment with Dr. Fatema on Apr 22 at 10:00 AM is confirmed.',   'INFO',    0, '/appointments'),
(10, 'Appointment Upcoming',     'Reminder: Appointment with Dr. Karim tomorrow at 8:00 AM.',              'INFO',    0, '/appointments');

-- ════════════════════════════════
-- 13. CHAT MESSAGES
-- ════════════════════════════════
INSERT INTO chat_messages (sender_id, receiver_id, message, read_message) VALUES
(6,  2, 'Doctor, I still have fever after 2 days. Should I take more medicine?',          1),
(2,  6, 'Please continue paracetamol for 2 more days and drink plenty of water.',         1),
(6,  2, 'Thank you doctor. Should I come for a follow-up visit?',                         0),
(7,  3, 'Doctor, the nasal spray is not available at any pharmacy nearby.',               1),
(3,  7, 'You can use Budesonide spray as an alternative. Same dosage applies.',           0),
(9,  4, 'Doctor, my blood sugar reading is 180 today. Is that concerning?',               1),
(4,  9, 'That is slightly high. Please avoid sweets and increase walking time.',          1),
(10, 4, 'I have been feeling dizzy since starting the new blood pressure medicine.',      0),
(8,  3, 'Doctor, my back pain is getting worse. Should I get an X-ray?',                 1),
(3,  8, 'Yes, please get a lumbar spine X-ray. I will write a referral for you.',        0);

-- ════════════════════════════════
-- VERIFY
-- ════════════════════════════════
SELECT 'users'            as tbl, COUNT(*) as rows FROM users
UNION ALL SELECT 'profiles',         COUNT(*) FROM profiles
UNION ALL SELECT 'appointments',     COUNT(*) FROM appointments
UNION ALL SELECT 'medical_records',  COUNT(*) FROM medical_records
UNION ALL SELECT 'prescriptions',    COUNT(*) FROM prescriptions
UNION ALL SELECT 'lab_tests',        COUNT(*) FROM lab_tests
UNION ALL SELECT 'lab_reports',      COUNT(*) FROM lab_reports
UNION ALL SELECT 'test_reports',     COUNT(*) FROM test_reports
UNION ALL SELECT 'medicines',        COUNT(*) FROM medicines
UNION ALL SELECT 'billing_invoices', COUNT(*) FROM billing_invoices
UNION ALL SELECT 'notifications',    COUNT(*) FROM notifications
UNION ALL SELECT 'chat_messages',    COUNT(*) FROM chat_messages
UNION ALL SELECT 'doctor_availability', COUNT(*) FROM doctor_availability;