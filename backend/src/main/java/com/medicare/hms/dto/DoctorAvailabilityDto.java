package com.medicare.hms.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAvailabilityDto {
    private Long id;

    @JsonProperty("doctorId")
    @JsonAlias({ "doctor_id" })
    private Long doctorId;

    @JsonProperty("dayOfWeek")
    @JsonAlias({ "day_of_week" })
    private Integer dayOfWeek;

    @JsonProperty("startTime")
    @JsonAlias({ "start_time" })
    private String startTime;

    @JsonProperty("endTime")
    @JsonAlias({ "end_time" })
    private String endTime;

    @JsonProperty("breakStart")
    @JsonAlias({ "break_start" })
    private String breakStart;

    @JsonProperty("breakEnd")
    @JsonAlias({ "break_end" })
    private String breakEnd;

    @JsonProperty("isAvailable")
    @JsonAlias({ "is_available" })
    private Boolean isAvailable;

    @JsonProperty("slotDuration")
    @JsonAlias({ "slot_duration" })
    private Integer slotDuration;
}
