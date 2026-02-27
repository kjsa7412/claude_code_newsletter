FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
