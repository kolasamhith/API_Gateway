Secure API Gateway with Distributed Rate Limiting
A robust, production-ready API Gateway designed to serve as the single entry point for microservices. This project addresses critical backend challenges including traffic management, security, and observability.

Key Features
JWT Authentication: Implements stateless authentication. Every request is intercepted and verified before reaching internal services.

Role-Based Access Control (RBAC): Restricts access to sensitive endpoints (e.g., /products) based on user roles (Admin, Developer, User) encoded within the JWT.

Distributed Rate Limiting: Utilizes Redis to implement a sliding-window rate limiter. It restricts clients to 10 requests per second to prevent DoS attacks and resource exhaustion.

Request Logging & Observability: Automatically logs metadata (endpoint, status code, IP, user ID) for every request to MongoDB for audit trails and system monitoring.

Security Hardening: Integrated Helmet.js for secure HTTP headers, payload size limits to prevent memory exhaustion, and NoSQL injection sanitization.

Dynamic Proxy Routing: Seamlessly routes traffic to various microservices while hiding internal network architecture from the client.

Tech Stack
Runtime: Node.js

Framework: Express.js

Database: MongoDB (Logging)

Cache: Redis (Rate Limiting)

Security: JSON Web Tokens (JWT), Helmet, Express-Rate-Limit
