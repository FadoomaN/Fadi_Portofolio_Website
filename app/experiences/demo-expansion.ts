import type { ExperienceRecord } from './experience-timeline';

// Temporary layout fixtures, not database records or real career history.
const roles = [
  ['Electronics Lab Assistant', 'Demo Signal Studio', 'Assembled sensor boards and documented measurements from repeatable bench tests.'],
  ['Automation Developer', 'Demo Motion Works', 'Built a small controller that coordinated motors, inputs and a monitoring dashboard.'],
  ['Frontend Developer', 'Demo Interface Lab', 'Created responsive interfaces for device status, settings and live measurements.'],
  ['Robotics Intern', 'Demo Robotics Studio', 'Prototyped movement sequences and tested feedback from distance and position sensors.'],
  ['Hardware Verification Engineer', 'Demo Boardworks', 'Checked power rails, communication buses and timing against prototype requirements.'],
  ['Backend Developer', 'Demo Data Systems', 'Implemented request handling, validation and storage for connected-device applications.'],
  ['PCB Design Assistant', 'Demo Copper Lab', 'Prepared schematic revisions and reviewed component placement for a compact sensor board.'],
  ['Control Systems Trainee', 'Demo Feedback Works', 'Compared controller responses and recorded the effect of changing system parameters.'],
  ['Network Support Technician', 'Demo Packet Studio', 'Investigated connectivity issues and prepared clear setup guides for a small test network.'],
  ['Application Developer', 'Demo App Workshop', 'Built a desktop utility for configuring prototypes and exporting measurement sessions.'],
  ['Sensor Integration Engineer', 'Demo Sensing Lab', 'Connected different sensor modules and compared their readings under controlled conditions.'],
  ['QA Automation Intern', 'Demo Quality Works', 'Created repeatable checks for device setup, communication and error recovery.'],
  ['Embedded Linux Developer', 'Demo Kernel Studio', 'Configured a small Linux device and integrated services for collecting hardware data.'],
  ['Digital Logic Designer', 'Demo Logic Workshop', 'Designed and simulated counters, registers and finite-state machines for a prototype.'],
  ['Technical Documentation Assistant', 'Demo Reference Lab', 'Turned engineering notes into assembly instructions and troubleshooting references.'],
  ['Research Assistant', 'Demo Discovery Works', 'Compared technical approaches and summarized findings from a series of prototype experiments.'],
  ['Power Electronics Trainee', 'Demo Power Studio', 'Measured converter behaviour and documented efficiency across different test loads.'],
  ['Test Bench Developer', 'Demo Measurement Lab', 'Automated instrument readings and presented repeatable results in a simple test report.'],
  ['Device Integration Specialist', 'Demo Connected Works', 'Connected a prototype device to an application and verified the complete data flow.'],
  ['Product Prototyping Intern', 'Demo Form Studio', 'Combined hardware and software ideas into an early demonstrator for usability testing.'],
  ['Systems Engineering Assistant', 'Demo Systems Workshop', 'Mapped component interfaces and tracked how individual changes affected the whole prototype.'],
  ['Engineering Workshop Volunteer', 'Demo Maker Lab', 'Helped assemble beginner electronics projects and explain their circuits and test results.'],
] as const;

export const additionalDemoExperiences: ExperienceRecord[] = roles.map(([role, organization, summary], index) => {
  const year = 2017 - Math.floor(index / 3);
  const month = 9 - (index % 3) * 4;

  return {
    id: `10000000-0000-4000-8000-${String(index + 9).padStart(12, '0')}`,
    role,
    organization,
    summary,
    employment_type: ['contract', 'part-time', 'internship'][index % 3],
    location: ['Malmö, Sweden', 'Lund, Sweden', 'Remote'][index % 3],
    start_date: `${year}-${String(month).padStart(2, '0')}-01`,
    end_date: `${year}-${String(month + 2).padStart(2, '0')}-28`,
    is_current: false,
  };
});
