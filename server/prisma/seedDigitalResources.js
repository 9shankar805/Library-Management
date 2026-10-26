import prisma from "../config/db.js";

const digitalResources = [
  {
    title: "Structure and Interpretation of Computer Programs (SICP)",
    author: "Harold Abelson & Gerald Jay Sussman",
    description: "The legendary MIT computer science classic exploring programming paradigms, functional programming, and interpreters.",
    type: "EBOOK",
    fileUrl: "https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/9780262510875/SICP_text.pdf",
    fileSize: "4.8 MB",
    department: "Computer Science & Engineering",
    accessRole: "ALL"
  },
  {
    title: "Operating Systems: Three Easy Pieces (OSTEP)",
    author: "Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau",
    description: "Comprehensive foundational textbook covering virtualization (CPU, memory), concurrency (threads, locks), and persistence (file systems).",
    type: "EBOOK",
    fileUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/ostep.pdf",
    fileSize: "6.2 MB",
    department: "Computer Science & Engineering",
    accessRole: "ALL"
  },
  {
    title: "CS301: Advanced Data Structures & Algorithm Analysis Lecture Notes",
    author: "Dr. P. Suresh, Dept. of CSE",
    description: "Complete lecture notes covering red-black trees, B-trees, dynamic programming, network flows, and NP-completeness.",
    type: "NOTES",
    fileUrl: "/digital-docs/cs301-algorithms-notes.pdf",
    fileSize: "3.1 MB",
    department: "Computer Science & Engineering",
    accessRole: "ALL"
  },
  {
    title: "EE204: Signals and Linear Systems Comprehensive Notes",
    author: "Prof. K. Ramanathan, Dept. of EEE",
    description: "Course handouts on continuous and discrete-time signals, Fourier transforms, Laplace transforms, and Z-transforms with solved examples.",
    type: "NOTES",
    fileUrl: "/digital-docs/ee204-signals-notes.pdf",
    fileSize: "5.4 MB",
    department: "Electrical Engineering",
    accessRole: "ALL"
  },
  {
    title: "ME412: Finite Element Methods in Structural Analysis",
    author: "Dr. V. Rao, Dept. of Mechanical Engineering",
    description: "Laboratory manual and theory notes for 1D, 2D, and axisymmetric finite element modeling using ANSYS and MATLAB.",
    type: "NOTES",
    fileUrl: "/digital-docs/me412-fem-notes.pdf",
    fileSize: "7.8 MB",
    department: "Mechanical Engineering",
    accessRole: "ALL"
  },
  {
    title: "Deep Learning Approaches for Autonomous Drone Waypoint Navigation in GPS-Denied Environments",
    author: "Rahul Varma (Roll: 19CS042)",
    description: "M.Tech Dissertation thesis submitted to the Department of Computer Science & Engineering, NIT Andhra Pradesh (2024).",
    type: "THESIS",
    fileUrl: "/digital-docs/thesis-drone-nav-2024.pdf",
    fileSize: "14.2 MB",
    department: "Computer Science & Engineering",
    accessRole: "ALL"
  },
  {
    title: "Design and Thermal Optimization of Microchannel Heat Sinks for High-Power Density Electronic Chips",
    author: "Sneha Reddy (Roll: 19ME018)",
    description: "Ph.D. Thesis on convective heat transfer enhancement using nanofluids and microchannel topologies (2025).",
    type: "THESIS",
    fileUrl: "/digital-docs/thesis-microchannel-heat-sink.pdf",
    fileSize: "18.5 MB",
    department: "Mechanical Engineering",
    accessRole: "ALL"
  },
  {
    title: "Attention Is All You Need (Transformer Architecture)",
    author: "Vaswani et al. (Google Research)",
    description: "Seminal research paper introducing the Transformer network based entirely on attention mechanisms, replacing recurrent networks.",
    type: "RESEARCH_PAPER",
    fileUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    fileSize: "2.1 MB",
    department: "Computer Science & Engineering",
    accessRole: "ALL"
  },
  {
    title: "A Survey on LoRaWAN and Narrowband IoT Networks for Smart Campus Metering",
    author: "Dr. M. Lakshmi & Research Scholars, NIT-AP",
    description: "Peer-reviewed IEEE Transactions paper on LPWAN deployment benchmarking across academic university campuses.",
    type: "RESEARCH_PAPER",
    fileUrl: "/digital-docs/ieee-smart-campus-lora.pdf",
    fileSize: "1.9 MB",
    department: "Electronics & Communication",
    accessRole: "ALL"
  },
  {
    title: "Introduction to Linear Algebra and Optimization for Machine Learning",
    author: "Prof. Gilbert Strang (Open Courseware)",
    description: "Companion textbook covering vector spaces, eigenvalues, singular value decomposition (SVD), and gradient descent.",
    type: "EBOOK",
    fileUrl: "/digital-docs/linear-algebra-ml.pdf",
    fileSize: "8.6 MB",
    department: "Mathematics",
    accessRole: "ALL"
  }
];

async function seed() {
  console.log("📚 Seeding digital resources into library database...");
  await prisma.digitalResource.deleteMany({});
  for (const res of digitalResources) {
    await prisma.digitalResource.create({ data: res });
  }
  const count = await prisma.digitalResource.count();
  console.log(`✅ Successfully seeded ${count} digital resources!`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
