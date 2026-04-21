-- Add availability for all doctors (Sunday=0 to Saturday=6)
-- Dr. Jane Alam
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available)
SELECT 'a0456579-ec75-4938-a71e-7d623a705852', d, '09:00', '17:00', '13:00', '14:00', 30, true
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

-- Dr. Sarah Rahman
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available)
SELECT 'c68a13eb-4463-41db-a449-403bce01ea81', d, '10:00', '18:00', '13:00', '14:00', 30, true
FROM generate_series(1, 5) AS d
ON CONFLICT DO NOTHING;

-- Dr. Ahmed Khan
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available)
SELECT '2c75c8f3-8acb-4fe3-810f-dd5273549717', d, '08:00', '16:00', '12:00', '13:00', 30, true
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

-- Dr. Fatima Akter
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available)
SELECT 'b99daeb4-9ac7-4c74-9b77-49f12d10cbfe', d, '09:00', '15:00', '12:00', '12:30', 20, true
FROM generate_series(1, 6) AS d
ON CONFLICT DO NOTHING;

-- Dr. Hasan Ali
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available)
SELECT '5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', d, '11:00', '19:00', '14:00', '15:00', 30, true
FROM generate_series(0, 5) AS d
ON CONFLICT DO NOTHING;