// backend/src/seed/seedTasks.ts
import dotenv from 'dotenv';

dotenv.config();

import {query} from '../db';
import {v4 as uuidv4} from 'uuid';
import dayjs, {Dayjs} from 'dayjs';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const createZipFromFolder = (sourceFolder: string, zipPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {zlib: {level: 9}});

        output.on('close', () => {
            console.log(`📦 Created ZIP file (${archive.pointer()} bytes): ${zipPath}`);
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
};

const seedTasks = async (): Promise<void> => {
    try {
        console.log('🌱 Seeding tasks using v1...');

        // Tabelle erstellen
        await query(`
            CREATE TABLE IF NOT EXISTS tasks
            (
                id
                UUID
                PRIMARY
                KEY,
                title
                TEXT
                NOT
                NULL,
                description
                TEXT,
                difficulty
                TEXT,
                pseudocode
                TEXT,
                sample_solution
                TEXT,
                worksheet_path
                TEXT,
                sim_work_path
                TEXT,
                sim_solution_path
                TEXT,
                created_at
                TIMESTAMP
                DEFAULT
                NOW
            (
            ),
                start_date DATE,
                due_date DATE
                );
        `);
        console.log('🧱 Table "tasks" ensured');

        await query('DELETE FROM tasks');
        console.log('🗑️  All tasks deleted');

        const uploadBasePath = path.join(__dirname, '../public/uploads');
        if (fs.existsSync(uploadBasePath)) {
            fs.rmSync(uploadBasePath, {recursive: true, force: true});
            console.log('🧹 All uploaded simulations deleted');
        }

        // Datumshilfen
        const today: Dayjs = dayjs().startOf('day');
        const tomorrow: Dayjs = today.add(1, 'day');
        const inTwoDays: Dayjs = today.add(2, 'day');
        const inThreeDays: Dayjs = today.add(3, 'day');
        const inFourDays: Dayjs = today.add(4, 'day');
        const inFiveDays: Dayjs = today.add(5, 'day');
        const inSixDays: Dayjs = today.add(6, 'day');
        const inSevenDays: Dayjs = today.add(7, 'day');
        const inEightDays: Dayjs = today.add(8, 'day');
        const inFifteenDays: Dayjs = today.add(15, 'day');
        const inTwentyDays: Dayjs = today.add(20, 'day');
        const inOneMonth: Dayjs = today.add(30, 'day');
        const inOneMonthPlusFive: Dayjs = inOneMonth.add(5, 'day');
        const inOneMonthPlusSeven: Dayjs = inOneMonth.add(7, 'day');
        const inOneMonthPlusTen: Dayjs = inOneMonth.add(10, 'day');

        const yesterday: Dayjs = today.subtract(1, 'day');
        const twoDaysAgo: Dayjs = today.subtract(2, 'day');
        const threeDaysAgo: Dayjs = today.subtract(3, 'day');
        const fourDaysAgo: Dayjs = today.subtract(4, 'day');
        const fiveDaysAgo: Dayjs = today.subtract(5, 'day');
        const sixDaysAgo: Dayjs = today.subtract(6, 'day');
        const sevenDaysAgo: Dayjs = today.subtract(7, 'day');
        const eightDaysAgo: Dayjs = today.subtract(8, 'day');
        const tenDaysAgo: Dayjs = today.subtract(10, 'day');


        const tasks = [

            {
                title: 'Global Python Example',
                startDate: today,
                dueDate: inOneMonth,
                difficulty: 'Hard',
                description: `Make the robot move in a circle and stand still if it reaches its initial location.`,
                sampleSolution: `# Ausgangsposition simulieren
x, y = 0.0, 0.0   # Startpunkt
angle = 0.0       # Richtung in Grad
distance_travelled = 0.0

# Schrittweite
step_forward = 0.2
step_turn = 10.0

# Einfachheitshalber: maximale Schleifenbegrenzung, damit es nicht ewig läuft
max_steps = 500
steps = 0

while True:
    forward(step_forward)   # Robot vorwärts
    turn(step_turn)         # Robot drehen

    # Neue Position berechnen
    import math
    rad = math.radians(angle)
    x += step_forward * math.cos(rad)
    y += step_forward * math.sin(rad)

    # Drehung hinzufügen
    angle += step_turn
    angle %= 360  # Winkel normalisieren

    steps += 1
    # Stoppen, wenn wieder am Start (ungefähr)
    if math.isclose(x, 0.0, abs_tol=0.1) and math.isclose(y, 0.0, abs_tol=0.1):
        break

    # Sicherheit: maximale Schritte
    if steps >= max_steps:
        break


`,
                pseudocode: `while True:
    forward(step_forward)   # Robot vorwärts
    turn(step_turn)         # Robot drehen
`
            },


            {
                title: 'C# (Unity) 1/5 - Simple LED Blink',
                startDate: today,
                dueDate: tomorrow,
                difficulty: 'Easy',
                description: `Your robot has a status LED that needs to blink to indicate readiness. Use Unity C# to implement a blinking pattern that repeats a few times.`,
                sampleSolution: `// C# (Unity)
using UnityEngine;
using System.Collections;

public class LEDBlink : MonoBehaviour {
    public GameObject led;
    public int blinkCount = 5;

    void Start() {
        StartCoroutine(BlinkPattern());
    }

    IEnumerator BlinkPattern() {
        for (int i = 0; i < blinkCount; i++) {
            led.SetActive(true);
            yield return new WaitForSeconds(0.5f);
            led.SetActive(false);
            yield return new WaitForSeconds(0.5f);
        }
    }
}`,
                pseudocode: `// Pseudocode Skeleton
initializeLED();
repeat N times:
    turnLEDOn();
    wait();
    turnLEDOff();
    wait();`
            },
            {
                title: 'C# (Unity) 2/5 - Move Forward Sequence',
                startDate: tomorrow,
                dueDate: inTwoDays,
                difficulty: 'Easy',
                description: `Now your robot needs to move forward a certain distance. Implement a smooth motion in Unity C# using a coroutine to reach the target.`,
                sampleSolution: `// C# (Unity)
using UnityEngine;
using System.Collections;

public class MoveForward : MonoBehaviour {
    public Transform robot;
    public Vector3 targetPosition;
    public float speed = 2f;

    void Start() {
        StartCoroutine(MoveToTarget());
    }

    IEnumerator MoveToTarget() {
        while (Vector3.Distance(robot.position, targetPosition) > 0.01f) {
            robot.position = Vector3.MoveTowards(robot.position, targetPosition, speed * Time.deltaTime);
            yield return null;
        }
        Debug.Log("Reached target position");
    }
}`,
                pseudocode: `// Pseudocode Skeleton
initializeRobot();
setTargetPosition();
while not at target:
    moveTowardsTarget();
reportArrival();`
            },
            {
                title: 'C# (Unity) 3/5 - Pick Object',
                startDate: inTwoDays,
                dueDate: inThreeDays,
                difficulty: 'Medium',
                description: `Extend your robot to pick up an object. Implement gripper movement and grabbing logic. Use coroutines in Unity C# for smooth transitions.`,
                sampleSolution: `// C# (Unity)
using UnityEngine;
using System.Collections;

public class PickObject : MonoBehaviour {
    public Transform gripper;
    public Transform objectToPick;
    public float speed = 1.5f;

    void Start() {
        StartCoroutine(PickRoutine());
    }

    IEnumerator PickRoutine() {
        // Move to object
        yield return MoveTo(gripper, objectToPick.position);
        CloseGripper();
    }

    IEnumerator MoveTo(Transform obj, Vector3 destination) {
        while (Vector3.Distance(obj.position, destination) > 0.01f) {
            obj.position = Vector3.MoveTowards(obj.position, destination, speed * Time.deltaTime);
            yield return null;
        }
    }

    void CloseGripper() {
        Debug.Log("Object picked up");
    }
}`,
                pseudocode: `// Pseudocode Skeleton
moveGripperToObject();
closeGripper();`
            },
            {
                title: 'C# (Unity) 4/5 - Place Object',
                startDate: inThreeDays,
                dueDate: inFourDays,
                difficulty: 'Medium',
                description: `After picking an object, your robot should place it at a designated location. Implement smooth movement and gripper release.`,
                sampleSolution: `// C# (Unity)
using UnityEngine;
using System.Collections;

public class PlaceObject : MonoBehaviour {
    public Transform gripper;
    public Transform targetPosition;
    public float speed = 1.5f;

    void Start() {
        StartCoroutine(PlaceRoutine());
    }

    IEnumerator PlaceRoutine() {
        yield return MoveTo(gripper, targetPosition.position);
        OpenGripper();
    }

    IEnumerator MoveTo(Transform obj, Vector3 destination) {
        while (Vector3.Distance(obj.position, destination) > 0.01f) {
            obj.position = Vector3.MoveTowards(obj.position, destination, speed * Time.deltaTime);
            yield return null;
        }
    }

    void OpenGripper() {
        Debug.Log("Object released");
    }
}`,
                pseudocode: `// Pseudocode Skeleton
moveGripperToTarget();
openGripper();`
            },
            {
                title: 'C# (Unity) 5/5 - Full Pick and Place Routine',
                startDate: inFourDays,
                dueDate: inFiveDays,
                difficulty: 'Hard',
                description: `Combine previous skills to implement a full pick and place sequence: move, pick, move, and place. Use coroutines for smooth motion. Unity C#`,
                sampleSolution: `// C# (Unity)
using UnityEngine;
using System.Collections;

public class FullPickPlace : MonoBehaviour {
    public Transform gripper;
    public Transform objectToPick;
    public Transform targetPosition;
    public float speed = 2f;

    void Start() {
        StartCoroutine(FullRoutine());
    }

    IEnumerator FullRoutine() {
        // Move to object
        yield return MoveTo(gripper, objectToPick.position);
        CloseGripper();
        // Move to target
        yield return MoveTo(gripper, targetPosition.position);
        OpenGripper();
    }

    IEnumerator MoveTo(Transform obj, Vector3 destination) {
        while (Vector3.Distance(obj.position, destination) > 0.01f) {
            obj.position = Vector3.MoveTowards(obj.position, destination, speed * Time.deltaTime);
            yield return null;
        }
    }

    void CloseGripper() {
        Debug.Log("Object picked up");
    }

    void OpenGripper() {
        Debug.Log("Object released");
    }
}`,
                pseudocode: `// Pseudocode Skeleton
implementPickAndPlaceRoutine();
useMoveToFunction();
closeGripperAtObject();
openGripperAtTarget();`
            },

            {
                title: 'Python (ROS2) 1/5 - Robot Arm Calibration',
                startDate: tenDaysAgo,
                dueDate: sixDaysAgo,
                difficulty: 'Easy',
                description: `Your robot arm has just arrived in the lab. Your first mission is to calibrate it so it can pick up objects safely and precisely. Make sure it recognizes different object sizes and grips them correctly. Language: Python with ROS2.`,
                sampleSolution: `# Python (ROS2)
import rclpy
from robot_interfaces.srv import CalibrateArm

def calibrate_robot():
    client = rclpy.create_client(CalibrateArm, 'calibrate_arm')
    req = CalibrateArm.Request()
    req.max_attempts = 5
    response = client.call(req)
    if response.success:
        print("Calibration successful")
    else:
        print("Calibration failed")

def pick_object():
    print("Picking up object...")
    # move arm to object position
    # close gripper
    # lift object

calibrate_robot()
pick_object()`,
                pseudocode: `// Easy Pseudocode Skeleton
initializeArm();
calibrateArm();
locateObject();
moveArmToObject();
closeGripper();
liftObject();`
            },
            {
                title: 'Python (ROS2) 2/5 - Basic Movement Sequence',
                startDate: sixDaysAgo,
                dueDate: fiveDaysAgo,
                difficulty: 'Easy',
                description: `The robot is in a small corridor and needs to navigate forward and make a precise right turn. Ensure smooth movement and obstacle avoidance. Language: Python with ROS2.`,
                sampleSolution: `# Python (ROS2)
import rclpy
from geometry_msgs.msg import Twist

def move_forward(pub):
    msg = Twist()
    msg.linear.x = 0.5
    pub.publish(msg)

def turn_right(pub):
    msg = Twist()
    msg.angular.z = -1.57
    pub.publish(msg)

def main():
    rclpy.init()
    node = rclpy.create_node("basic_move")
    pub = node.create_publisher(Twist, "cmd_vel", 10)
    move_forward(pub)
    turn_right(pub)
    rclpy.spin(node)

main()`,
                pseudocode: `// Easy Pseudocode Skeleton
initializeMotors();
moveForward();
checkFrontSensor();
if obstacleDetected:
    stopMovement();
turnRight();
resumeForward();`
            },
            {
                title: 'Python (ROS2) 3/5 - LED Signal Pattern',
                startDate: eightDaysAgo,
                dueDate: fourDaysAgo,
                difficulty: 'Easy',
                description: `Your robot communicates via LED lights. Create a blinking pattern to indicate readiness or idle state, like a heartbeat. Language: Python with GPIO.`,
                sampleSolution: `# Python (GPIO)
import time
import RPi.GPIO as GPIO

LED_PIN = 18
GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)

for i in range(10):
    GPIO.output(LED_PIN, True)
    time.sleep(0.5)
    GPIO.output(LED_PIN, False)
    time.sleep(0.5)

GPIO.cleanup()`,
                pseudocode: `// Easy Pseudocode Skeleton
initializeLED();
for i in range(10):
    turnLEDOn();
    wait(0.5);
    turnLEDOff();
    wait(0.5);`
            },
            {
                title: 'Python (ROS2) 4/5 - Simple Obstacle Avoidance',
                startDate: yesterday,
                dueDate: today,
                difficulty: 'Medium',
                description: `Your robot must navigate a small maze using front sensors to detect obstacles. Program it to stop or turn to avoid collisions. Language: Python with ROS2.`,
                sampleSolution: `# Python (ROS2)
import rclpy
from geometry_msgs.msg import Twist
from sensor_interfaces.msg import Range

def avoid_obstacle(sensor_data, pub):
    msg = Twist()
    if sensor_data.range < 0.5:
        msg.linear.x = 0.0
        msg.angular.z = 0.5
    else:
        msg.linear.x = 0.3
        msg.angular.z = 0.0
    pub.publish(msg)

def main():
    rclpy.init()
    node = rclpy.create_node("obstacle_avoidance")
    pub = node.create_publisher(Twist, "cmd_vel", 10)
    sub = node.create_subscription(Range, "front_sensor", lambda data: avoid_obstacle(data, pub), 10)
    rclpy.spin(node)

main()`,
                pseudocode: `// Medium Pseudocode Skeleton
initializeMotors();
initializeSensors();
while navigating:
    readFrontSensor();
    if obstacleDetected:
        stopOrTurn();
    else:
        moveForward();`
            },
            {
                title: 'Python (ROS2) 5/5 - Pick and Place Routine',
                startDate: yesterday,
                dueDate: inTwoDays,
                difficulty: 'Medium',
                description: `Program the robot to pick up an object and place it on a designated spot. Use vision or sensors to locate the object accurately. Language: Python with ROS2.`,
                sampleSolution: `# Python (ROS2)
import rclpy
from robot_interfaces.srv import PickPlace

def pick_and_place():
    client = rclpy.create_client(PickPlace, 'pick_place')
    req = PickPlace.Request()
    req.object_id = 1
    req.target_position = [0.5, 0.0, 0.2]
    response = client.call(req)
    if response.success:
        print("Object successfully moved")
    else:
        print("Failed to move object")

pick_and_place()`,
                pseudocode: `// Medium Pseudocode Skeleton
initializeArm();
locateObject();
moveArmToObject();
gripObject();
moveArmToTarget();
releaseObject();`
            }
        ];

        // Templates
        const simTemplate = path.join(__dirname, 'simulation_template');
        const pdfTemplate = path.join(__dirname, 'pdf_template');

        const dummySimPath = path.join(__dirname, 'example_simulation.zip');
        const dummyPdfPath = path.join(__dirname, 'example_worksheet.pdf');

        if (!fs.existsSync(dummySimPath)) {
            await createZipFromFolder(simTemplate, dummySimPath);
        }
        if (!fs.existsSync(dummyPdfPath)) {
            fs.copyFileSync(path.join(pdfTemplate, 'dummy.pdf'), dummyPdfPath);
        }

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const id = uuidv4();
            const createdAt = dayjs().toISOString();
            const start = task.startDate.format('YYYY-MM-DD');
            const due = task.dueDate.format('YYYY-MM-DD');

            const uploadDir = path.join(uploadBasePath, id);
            const workDir = path.join(uploadDir, 'work');
            const solutionDir = path.join(uploadDir, 'solution');

            let simWorkDbPath: string;
            let simSolutionDbPath: string;

            if (task.title === 'Global Python Example') {
                // globale Simulation verwenden, kein Copy nötig
                simWorkDbPath = '/assets/globalSim.zip';
                simSolutionDbPath = '/assets/globalSim.zip';
            } else {
                fs.mkdirSync(workDir, { recursive: true });
                fs.mkdirSync(solutionDir, { recursive: true });

                const simWorkFile = `sim_work_${i + 1}.zip`;
                fs.copyFileSync(dummySimPath, path.join(workDir, simWorkFile));
                simWorkDbPath = `/uploads/${id}/work/${simWorkFile}`;

                const simSolutionFile = `sim_solution_${i + 1}.zip`;
                fs.copyFileSync(dummySimPath, path.join(solutionDir, simSolutionFile));
                simSolutionDbPath = `/uploads/${id}/solution/${simSolutionFile}`;
            }

            fs.mkdirSync(uploadDir, { recursive: true });
            const worksheetFile = `worksheet_${i + 1}.pdf`;
            fs.copyFileSync(dummyPdfPath, path.join(uploadDir, worksheetFile));
            const worksheetDbPath = `/uploads/${id}/${worksheetFile}`;

            await query(
                `INSERT INTO tasks
         (id, title, description, difficulty, pseudocode, sample_solution,
          worksheet_path, sim_work_path, sim_solution_path, created_at, start_date, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    id,
                    task.title,
                    task.description,
                    task.difficulty,
                    task.pseudocode,
                    task.sampleSolution,
                    worksheetDbPath,
                    simWorkDbPath,
                    simSolutionDbPath,
                    createdAt,
                    start,
                    due
                ]
            );

            console.log(`📁 Task "${task.title}" seeded with simulation & PDF`);
        }

        console.log(`✅ Seeded ${tasks.length} tasks successfully`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedTasks();
