## Profile

Final-year AI student at the Faculty of Artificial Intelligence, Menoufia University (Graduating August 2026).

I specialize in building production-ready computer vision and deep learning systems that operate reliably on real hardware. My expertise spans the entire project lifecycle, from initial model architecture design to hardware-aware optimization, edge deployment, and automation. I am particularly passionate about developing automated workflows within Biometric Technologies, where security, precision, and real-time processing are paramount.

Bridging the gap between AI research and functional software, I frequently build high-performance desktop tools and interactive demos using PyQt. By merging deep learning pipelines with robust UI development and automation scripts, I deliver complete, end-to-end intelligent applications designed to solve real-world problems under strict computing constraints.

---

## Technical Skills

**Languages** — Python (Proficient), C++ (Intermediate)
**AI / ML** — Machine Learning, Deep Learning, Neural Networks, Transformers
**Computer Vision** — Image Processing, CNNs, ViTs, Person/Object Detection, Tracking & Segmentation  
**Frameworks** — PyTorch, TensorFlow, Keras, OpenCV, MediaPipe, YOLO, Scikit-Learn, Scikit-Image, PyQt6  
**Edge Deployment** — Raspberry Pi 5, Hailo-8L NPU, ONNX Runtime, Quantization, Pruning, Hardware Prototyping  
**Application Development** — Desktop GUI, Data/Event-Driven Architecture, SQLite
**Tools** — Git, Linux, Colab

---

## Projects

### Lynx DMS — Intelligent Edge-Deployed Driver Monitoring System
`Graduation Project`

The primary and most significant project to date. An end-to-end computer vision system for real-time driver state, behavior, and safety monitoring — engineered for production deployment on constrained edge hardware.

**Implemented subsystems:**
- Face recognition pipeline for authorized access control and driver validation (ArcFace R50, 512-d embeddings, ONNX)
- Fatigue and distraction detection via a continuous multi-class detection pipeline with an event-driven alert engine
- Real-time emotion and safety analysis (EfficientNet-B0 on RAF-DB, MobileNetV3-Small for mask detection)
- Privacy-preserving local dashboard — all processing and logging on-device (PyQt6, SQLite)
- Structured event-flagging engine designed for integration with external hardware controllers, contact interfaces, or fleet management systems

**Delivered:** sub-30ms inference latency, >95% accuracy on critical safety alerts, low false positive rate on a Raspberry Pi 5 + Hailo-8L NPU target.

**Stack:** Python, PyTorch, TensorFlow, MediaPipe, OpenCV, Scikit-Image, PyQt6, SQLite, ONNX, Raspberry Pi 5, Hailo-8L NPU

**Source:** [github.com/asem-sharif-ai/Lynx-DMS](https://github.com/asem-sharif-ai/Lynx-DMS) *(Currently still private; will be opened post-graduation)*

---

### Custom Perception Engines & Biometric Repositories
`Personal Projects`

A collection of high-performance, modular computer vision repositories designed to serve as the core perception and biometric processing layers for real-world automation systems.

**Implemented subsystems:**
- Robust Detection & Structural Alignment: Multi-stage face localized detection pipeline using MediaPipe, incorporating custom spatial transformation matrices for precise affine facial alignment based on 5-point landmark topologies.
- Biometric Security & Passive PAD: A lightweight Presentation Attack Detection (PAD) engine optimized for edge execution, using statistical frequency analysis and localized texture mathematics to detect spoofing attempts without heavy deep learning overhead.
- Multi-Attribute Extraction Engine: Concurrent inference layers optimized for granular facial analysis, capable of real-time extraction of multiple distinct features including facial expression (emotion classification), mask presence, and eyewear detection.
- High-Throughput Frame Preprocessing: Hardware-agnostic frame streaming, scaling, and normalization pipelines designed to minimize preprocessing bottlenecks before feeding tensors into downstream embeddings generators.

**Delivered:** Modulartiy-first codebase structured to be dropped cleanly into complex PyQt production applications, ensuring low-latency frame iteration and clean thread separation.

**Stack:** Python, MediaPipe, OpenCV, NumPy, Scikit-Learn, PyTorch

**Sources:**
- [github.com/asem-sharif-ai/FaceDetector](https://github.com/asem-sharif-ai/FaceDetector)     
- [github.com/asem-sharif-ai/FaceRecognizer](https://github.com/asem-sharif-ai/FaceRecognizer)     

---

### YTFetcherPlus — Desktop Video Downloader
`Personal Project`

A PyQt6 desktop application for downloading video and audio from YouTube and most major video platforms, built on yt-dlp. Designed with a polished, premium-feel interface and a clean, maintainable codebase. Ships with a full custom QSS stylesheet, format selection, progress tracking, and download queue management.

**Stack:** Python, PyQt6, yt-dlp

[`github.com/asem-sharif-ai/YTFetcherPlus`](https://github.com/asem-sharif-ai/YTFetcherPlus)

---

### Undergraduate Portfolio
`Academic Progress · 2022/2026`

A collection of projects spanning the four-year undergraduate program. Selected highlights:

**Machine Learning No-Code App** — A desktop interface that exposes a full ML pipeline (data loading, preprocessing, model selection, training, evaluation) without requiring the user to write any code. Built to make classical ML workflows accessible and inspectable.

**Deep Learning Hand Gesture Recognition** — Real-time hand gesture classification using a deep learning pipeline on top of MediaPipe landmark extraction. Designed for low-latency inference on CPU.

Additional projects cover classical algorithms, image processing, cryptography tooling, and GUI applications developed across coursework.

[`github.com/asem-sharif-ai/ai-undergraduate`](https://github.com/asem-sharif-ai/ai-undergraduate)

---

## Experience

**Junior AI Developer / Research Assistant** — Freelance `[2024 - Present]`  
End-to-end ML workflows: model evaluation with domain-appropriate metrics, iterative tuning on real-world datasets, and systematic hyperparameter optimization for accuracy and generalization.

**Instructor** — Digital Egypt Cubs Initiative (DECI) `[2025]`  
Delivered foundational computer science and digital technology sessions for youth audiences as part of the national DECI initiative, powered by Udacity and CLS. Designed small applied exercises to bridge theory and practice.

---

## Education

**Faculty of Artificial Intelligence — Menoufia University** `[Oct 2022 - Aug 2026]`  
B.Sc. in Artificial Intelligence · Cyber Security Department  
GPA: **3.55 / 4.0 (A — Excellent Standing)** · 120 Credit Hours

Coursework: Mathematics, Programming, Software Engineering, Machine Learning, Deep Learning, Computer Vision, Data Analysis, Cryptography, Secure Software Development, Network Security
