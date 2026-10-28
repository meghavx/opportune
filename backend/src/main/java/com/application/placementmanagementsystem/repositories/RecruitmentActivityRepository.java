package com.application.placementmanagementsystem.repositories;

import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.RecruitmentActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecruitmentActivityRepository extends JpaRepository<RecruitmentActivity, Long> {

    List<RecruitmentActivity> findByPlacementDriveIdOrderByScheduledAtAsc(Long driveId);

    boolean existsByPlacementDriveAndTitleIgnoreCase(PlacementDrive placementDrive, String title);
}