package com.application.placementmanagementsystem.repositories;

import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlacementDriveRepository extends JpaRepository<PlacementDrive, Long> {

    @EntityGraph(attributePaths = "eligibilityCriteria")
    Optional<PlacementDrive> findByIdAndStatusNot(Long id, DriveStatus status);

    @EntityGraph(attributePaths = "eligibilityCriteria")
    Optional<PlacementDrive> findByIdAndCompanyId(Long id, Long companyId);

    @EntityGraph(attributePaths = "eligibilityCriteria")
    Optional<PlacementDrive> findByIdAndStatus(Long id, DriveStatus status);

    @EntityGraph(attributePaths = "eligibilityCriteria")
    List<PlacementDrive> findByStatusNot(DriveStatus status);

    List<PlacementDrive> findByCompanyId(Long id);

    @EntityGraph(attributePaths = "eligibilityCriteria")
    List<PlacementDrive> findByStatus(DriveStatus status);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndStatus(Long companyId, DriveStatus status);

    long countByStatus(DriveStatus status);

    Optional<PlacementDrive> findByCompanyAndJobRoleIgnoreCase(Company company, String jobRole);
}
