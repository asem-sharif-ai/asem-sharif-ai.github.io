### Undergraduate Portfolio
`Academic Progress · 2022/2026`

A collection of projects spanning the four-year undergraduate program. Selected highlights:

**Machine Learning No-Code App** — A desktop interface that exposes a full ML pipeline (data loading, preprocessing, model selection, training, evaluation) without requiring the user to write any code. Built to make classical ML workflows accessible and inspectable.

**Deep Learning Hand Gesture Recognition** — Real-time hand gesture classification using a deep learning pipeline on top of MediaPipe landmark extraction. Designed for low-latency inference on CPU.

Additional projects cover classical algorithms, image processing, cryptography tooling, and GUI applications developed across coursework.

[`github.com/asem-sharif-ai/ai-undergraduate`](https://github.com/asem-sharif-ai/ai-undergraduate)



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