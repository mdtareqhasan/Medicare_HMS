package com.medicare.hms.service;

import com.medicare.hms.dto.DoctorAvailabilityDto;
import com.medicare.hms.entity.DayOfWeek;
import com.medicare.hms.entity.DoctorAvailability;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.DoctorAvailabilityRepository;
import com.medicare.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorAvailabilityService {

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private UserRepository userRepository;

    public List<DoctorAvailabilityDto> getAvailability(Long doctorId) {
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        return availabilityRepository.findByDoctor(doctor).stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<DoctorAvailabilityDto> saveAvailabilityBulk(Long doctorId, List<DoctorAvailabilityDto> dtos) {
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        List<DoctorAvailability> toSave = new ArrayList<>();

        for (int i = 0; i < dtos.size(); i++) {
            DoctorAvailabilityDto dto = dtos.get(i);
            if (dto.getDayOfWeek() == null) {
                throw new IllegalArgumentException("dayOfWeek is required for availability slot at index " + i);
            }
            DoctorAvailability avail = availabilityRepository
                    .findByDoctorAndDayOfWeek(doctor, intToDayOfWeek(dto.getDayOfWeek()))
                    .orElse(new DoctorAvailability());

            avail.setDoctor(doctor);
            avail.setDayOfWeek(intToDayOfWeek(dto.getDayOfWeek()));
            avail.setStartTime(parseTime(dto.getStartTime()));
            avail.setEndTime(parseTime(dto.getEndTime()));
            avail.setBreakStart(parseTime(dto.getBreakStart()));
            avail.setBreakEnd(parseTime(dto.getBreakEnd()));
            avail.setSlotDuration(dto.getSlotDuration() == null ? 30 : dto.getSlotDuration());
            avail.setIsAvailable(dto.getIsAvailable() == null ? false : dto.getIsAvailable());

            toSave.add(avail);
        }

        List<DoctorAvailability> saved = availabilityRepository.saveAll(toSave);
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    private DayOfWeek intToDayOfWeek(Integer dayIndex) {
        if (dayIndex == null)
            throw new IllegalArgumentException("dayOfWeek is required");
        switch (dayIndex) {
            case 0:
                return DayOfWeek.SUNDAY;
            case 1:
                return DayOfWeek.MONDAY;
            case 2:
                return DayOfWeek.TUESDAY;
            case 3:
                return DayOfWeek.WEDNESDAY;
            case 4:
                return DayOfWeek.THURSDAY;
            case 5:
                return DayOfWeek.FRIDAY;
            case 6:
                return DayOfWeek.SATURDAY;
            default:
                throw new IllegalArgumentException("Invalid dayOfWeek index");
        }
    }

    public void deleteAvailability(Long doctorId, Long availabilityId) {
        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        if (!availability.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Not allowed");
        }
        availabilityRepository.delete(availability);
    }

    private DoctorAvailabilityDto toDto(DoctorAvailability availability) {
        DoctorAvailabilityDto dto = new DoctorAvailabilityDto();
        dto.setId(availability.getId());
        dto.setDoctorId(availability.getDoctor().getId());
        dto.setDayOfWeek(dayOfWeekToInt(availability.getDayOfWeek()));
        dto.setStartTime(formatTime(availability.getStartTime()));
        dto.setEndTime(formatTime(availability.getEndTime()));
        dto.setBreakStart(formatTime(availability.getBreakStart()));
        dto.setBreakEnd(formatTime(availability.getBreakEnd()));
        dto.setSlotDuration(availability.getSlotDuration());
        dto.setIsAvailable(availability.getIsAvailable());
        return dto;
    }

    private String formatTime(LocalTime startTime) {
        if (startTime == null)
            return null;
        return startTime.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private LocalTime parseTime(String time) {
        if (time == null || time.isEmpty())
            return null;
        return LocalTime.parse(time);
    }

    private int dayOfWeekToInt(DayOfWeek day) {
        if (day == null)
            return 0;
        switch (day) {
            case SUNDAY:
                return 0;
            case MONDAY:
                return 1;
            case TUESDAY:
                return 2;
            case WEDNESDAY:
                return 3;
            case THURSDAY:
                return 4;
            case FRIDAY:
                return 5;
            case SATURDAY:
                return 6;
            default:
                return 0;
        }
    }
}
