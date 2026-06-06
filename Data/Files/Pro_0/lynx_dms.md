# Lynx DMS: Intelligent Edge-Deployed Driver Monitoring System

The primary and most significant project to date. An end-to-end computer vision system for real-time driver state, behavior, and safety monitoring — engineered for production deployment on constrained edge hardware.

Built on a Raspberry Pi equipped with a Hailo-8L NPU. It features a full pipeline that detects drowsiness, distraction, and yawning through multi-features classification and multi-objects tracking, alongside behavior and emotion analysis. The system is paired with a sleek, glassmorphism-inspired UI dashboard.

### **Implemented subsystems:**
- Face recognition pipeline for authorized access control and driver validation (ArcFace R50, 512-d embeddings, ONNX)
- Fatigue and distraction detection via a continuous multi-class detection pipeline with an event-driven alert engine
- Real-time emotion and safety analysis (EfficientNet-B0 on RAF-DB, MobileNetV3-Small for mask detection)
- Privacy-preserving local dashboard — all processing and logging on-device (PyQt6, SQLite)
- Structured event-flagging engine designed for integration with external hardware controllers, contact interfaces, or fleet management systems

### **Key Features:**
* **Authorized Access Control:** Implements face recognition for secure driver validation and access management.
* **Safety & Emotion Analysis:** Real-time modules that continuously assess driver condition and emotional states.
* **Event-Driven Alert System:** Runs a continuous multi-class detection pipeline integrated with an instant alert system.
* **Privacy-Preserving Dashboard:** Local processing and logging dashboard ensuring all user data remains on-device.

### **Core Metrics & Achievements:**
**Ultra-Low Latency:** Delivered a production-ready edge prototype capable of **sub-30ms latency**. **High Precision:** Achieved **over 95% accuracy** with low false-positive rates for critical safety alerts.
**Seamless Interoperability:** Engineered a structured event-flagging engine that generates real-time descriptions and triggers, designed for integration with external hardware controllers, contact interfaces, or fleet management systems.

### **Delivered:** sub-30ms inference latency, >95% accuracy on critical safety alerts, low false positive rate on a Raspberry Pi 5 + Hailo-8L NPU target.

### **Stack:** Python, PyTorch, TensorFlow, MediaPipe, OpenCV, Scikit-Image, PyQt6, SQLite, ONNX, Raspberry Pi 5, Hailo-8L NPU

### **Source:** [github.com/asem-sharif-ai/Lynx-DMS](https://github.com/asem-sharif-ai/Lynx-DMS) *(Currently still private; will be opened post-graduation)*