-- Remove all existing availability
DELETE FROM doctor_availability;

-- Dr. Jane Alam (Cardiology) - Sat, Sun, Mon, Tue, Wed (6,0,1,2,3) - 5:00 PM to 9:00 PM
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
('a0456579-ec75-4938-a71e-7d623a705852', 0, '17:00', '21:00', null, null, 30, true),
('a0456579-ec75-4938-a71e-7d623a705852', 1, '17:00', '21:00', null, null, 30, true),
('a0456579-ec75-4938-a71e-7d623a705852', 2, '17:00', '21:00', null, null, 30, true),
('a0456579-ec75-4938-a71e-7d623a705852', 3, '17:00', '21:00', null, null, 30, true),
('a0456579-ec75-4938-a71e-7d623a705852', 6, '17:00', '21:00', null, null, 30, true);

-- Dr. Sarah Rahman (Neurology) - Mon, Wed, Thu (1,3,4) - 10:00 AM to 2:00 PM
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
('c68a13eb-4463-41db-a449-403bce01ea81', 1, '10:00', '14:00', null, null, 30, true),
('c68a13eb-4463-41db-a449-403bce01ea81', 3, '10:00', '14:00', null, null, 30, true),
('c68a13eb-4463-41db-a449-403bce01ea81', 4, '10:00', '14:00', null, null, 30, true);

-- Dr. Ahmed Khan (Orthopedics) - Sun, Tue, Thu, Fri (0,2,4,5) - 9:00 AM to 1:00 PM
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
('2c75c8f3-8acb-4fe3-810f-dd5273549717', 0, '09:00', '13:00', null, null, 20, true),
('2c75c8f3-8acb-4fe3-810f-dd5273549717', 2, '09:00', '13:00', null, null, 20, true),
('2c75c8f3-8acb-4fe3-810f-dd5273549717', 4, '09:00', '13:00', null, null, 20, true),
('2c75c8f3-8acb-4fe3-810f-dd5273549717', 5, '09:00', '13:00', null, null, 20, true);

-- Dr. Fatima Akter (Gynecology) - Sat, Mon, Wed (6,1,3) - 4:00 PM to 8:00 PM
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
('b99daeb4-9ac7-4c74-9b77-49f12d10cbfe', 6, '16:00', '20:00', null, null, 30, true),
('b99daeb4-9ac7-4c74-9b77-49f12d10cbfe', 1, '16:00', '20:00', null, null, 30, true),
('b99daeb4-9ac7-4c74-9b77-49f12d10cbfe', 3, '16:00', '20:00', null, null, 30, true);

-- Dr. Hasan Ali (Pediatrics) - Sun, Mon, Tue, Wed, Thu (0,1,2,3,4) - 6:00 PM to 10:00 PM
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_available) VALUES
('5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', 0, '18:00', '22:00', null, null, 30, true),
('5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', 1, '18:00', '22:00', null, null, 30, true),
('5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', 2, '18:00', '22:00', null, null, 30, true),
('5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', 3, '18:00', '22:00', null, null, 30, true),
('5f5ff721-4b9d-4a1f-849a-6f73f9f53c65', 4, '18:00', '22:00', null, null, 30, true);