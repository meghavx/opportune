# Build the Spring Boot application using Java 21 and Maven
FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace

# Copy Maven files first so Docker can cache dependency downloads
COPY mvnw pom.xml ./
COPY .mvn/ .mvn/
RUN chmod +x mvnw

# Copy the source code and package the application
COPY src/ src/
RUN ./mvnw --batch-mode --no-transfer-progress -DskipTests package

# Use a smaller JRE image to run the application
FROM eclipse-temurin:21-jre

# Run the application as a non-root user for better container security
RUN groupadd --system spring \
    && useradd --system --gid spring --create-home spring

WORKDIR /app

# Copy only the built JAR from the build stage into the runtime image
COPY --from=build --chown=spring:spring /workspace/target/placement-management-system-0.0.1-SNAPSHOT.jar app.jar

USER spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]