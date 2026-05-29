## DMD Dataset

This repository outlines a **Python-Based Cloud-Bridge Processing Pipeline** designed to overcome the infrastructure bottlenecks of handling massive datasets.

**The Problem:** The original Driver Monitoring Dataset (DMD) is **25 TB**, making it impossible to download or process on standard academic or research workstations. It also contains heavy, irrelevant modalities (depth, body, and hand streams).
**The Solution:** An automated pipeline executed in Google Colab that downloads data patches, filters out unneeded streams, downscales the required streams to 720p using FFmpeg, and deletes temporary files on the fly.
**The Core Focus:** The pipeline exclusively targets **driver facial behavior**, isolating only the `rgb_face` and `ir_face` video streams alongside their matching JSON annotations.
**The Impact:** Successfully reduced the dataset footprint from **25 TB to under 15 GB** (a ~2,500:1 reduction ratio), making local machine learning experimentation fast, accessible, and cost-effective.

---

## Interactive Visual Dashboard

To complement this processing pipeline, an **Interactive Analysis Dashboard** has been integrated into the project.

Instead of guessing the post-compression metrics, you can now use this visual tool to get real-time insights into the **actual storage size, detailed data descriptions, and patch distribution** of the optimized dataset. This brings full transparency to the dataset's final state before you download it to your local workstation.

---

## Synchronized Annotation Preview

To streamline data validation and quality control, the repository now features a **Synchronized Annotation Video Previewer**. 

Instead of manually parsing complex metadata files to check model targets, this tool opens any processed video stream and overlays its corresponding **OpenLABEL JSON annotations** directly onto the video feed in perfect frame-by-frame synchronization.

### Key Capabilities
- **Real-Time Label Sync:** Instantly maps time-series state annotations (e.g., blinking, yawning, head pose orientation) directly to the current playback frame.
- **Dual Stream Support:** Works seamlessly with both the optimized `rgb_face` and `ir_face` video outputs.
- **Visual Ground Truth Verification:** Provides immediate visual confirmation of driver behavior states, making it easy to spot anomalies or evaluate dataset integrity before training your models.
