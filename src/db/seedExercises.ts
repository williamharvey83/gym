import type { Equipment, MuscleGroup } from './types.ts';

/**
 * Preloaded exercise library. Ids are derived from names, so never rename an
 * entry here once released: add a new one instead. Bump SEED_VERSION when
 * adding entries so existing installs pick them up (user edits are kept).
 */
export const SEED_VERSION = 1;

type Row = [name: string, primary: MuscleGroup, secondary: MuscleGroup[], equipment: Equipment, cues: string[]];

const ROWS: Row[] = [
  // ---------- Chest ----------
  ['Barbell Bench Press', 'chest', ['triceps', 'shoulders'], 'barbell', [
    'Pin shoulder blades back and down',
    'Lower to mid-chest, elbows about 45°',
    'Drive feet into the floor',
    'Press up and slightly back over shoulders',
  ]],
  ['Incline Barbell Bench Press', 'chest', ['shoulders', 'triceps'], 'barbell', [
    'Set bench to 30–45°',
    'Lower to upper chest',
    'Keep shoulder blades pinned',
  ]],
  ['Decline Barbell Bench Press', 'chest', ['triceps'], 'barbell', [
    'Lock legs in before unracking',
    'Lower to lower chest',
    'Press straight up over shoulders',
  ]],
  ['Dumbbell Bench Press', 'chest', ['triceps', 'shoulders'], 'dumbbell', [
    'Kick dumbbells up from knees to start',
    'Lower until a stretch in the chest',
    'Press up and slightly together',
  ]],
  ['Incline Dumbbell Press', 'chest', ['shoulders', 'triceps'], 'dumbbell', [
    'Set bench to 30–45°',
    'Elbows slightly tucked, not flared',
    'Press up over upper chest',
  ]],
  ['Decline Dumbbell Press', 'chest', ['triceps'], 'dumbbell', [
    'Secure legs before lowering back',
    'Lower to lower chest',
    'Keep wrists stacked over elbows',
  ]],
  ['Dumbbell Fly', 'chest', ['shoulders'], 'dumbbell', [
    'Soft bend in elbows, held fixed',
    'Open wide until a chest stretch',
    'Hug the weights back together',
  ]],
  ['Incline Dumbbell Fly', 'chest', ['shoulders'], 'dumbbell', [
    'Bench at about 30°',
    'Keep elbows softly bent throughout',
    'Squeeze upper chest at the top',
  ]],
  ['Cable Crossover', 'chest', ['shoulders'], 'cable', [
    'Stagger stance, slight forward lean',
    'Sweep hands down and together',
    'Control the stretch on the way back',
  ]],
  ['Low-to-High Cable Fly', 'chest', ['shoulders'], 'cable', [
    'Set pulleys at the bottom',
    'Sweep up to chin height',
    'Keep a fixed bend in the elbows',
  ]],
  ['Machine Chest Press', 'chest', ['triceps', 'shoulders'], 'machine', [
    'Handles at mid-chest height',
    'Keep back flat against the pad',
    'Press without locking out hard',
  ]],
  ['Pec Deck', 'chest', ['shoulders'], 'machine', [
    'Seat so handles are at chest height',
    'Lead with the elbows',
    'Squeeze and pause when hands meet',
  ]],
  ['Smith Machine Bench Press', 'chest', ['triceps', 'shoulders'], 'machine', [
    'Position bench so bar meets mid-chest',
    'Pin shoulder blades back',
    'Press in a straight line',
  ]],
  ['Dumbbell Floor Press', 'chest', ['triceps'], 'dumbbell', [
    'Lie on the floor, knees bent',
    'Lower until upper arms touch the floor',
    'Pause, then press',
  ]],
  ['Push-Up', 'chest', ['triceps', 'shoulders', 'abs'], 'bodyweight', [
    'Body in one straight line',
    'Hands just outside shoulders',
    'Chest to an inch off the floor',
  ]],
  ['Chest Dip', 'chest', ['triceps', 'shoulders'], 'bodyweight', [
    'Lean torso forward',
    'Lower until shoulders are just below elbows',
    'Press up without shrugging',
  ]],

  // ---------- Lats ----------
  ['Pull-Up', 'lats', ['biceps', 'upperBack'], 'bodyweight', [
    'Overhand grip, just outside shoulders',
    'Start from a full hang',
    'Drive elbows down to your sides',
    'Chin over the bar',
  ]],
  ['Chin-Up', 'lats', ['biceps', 'upperBack'], 'bodyweight', [
    'Underhand grip, shoulder width',
    'Pull chest toward the bar',
    'Lower all the way down',
  ]],
  ['Assisted Pull-Up', 'lats', ['biceps', 'upperBack'], 'machine', [
    'More counterweight makes it easier',
    'Full hang at the bottom',
    'Drive elbows down to your sides',
  ]],
  ['Lat Pulldown', 'lats', ['biceps', 'upperBack'], 'cable', [
    'Thighs locked under the pad',
    'Slight lean back, chest up',
    'Pull bar to upper chest',
  ]],
  ['Close-Grip Lat Pulldown', 'lats', ['biceps', 'upperBack'], 'cable', [
    'Use a V-handle',
    'Pull handle to upper chest',
    'Squeeze lats at the bottom',
  ]],
  ['Single-Arm Lat Pulldown', 'lats', ['biceps'], 'cable', [
    'Reach high for a full stretch',
    'Pull elbow down toward your hip',
    'Keep torso still',
  ]],
  ['Straight-Arm Pulldown', 'lats', ['triceps'], 'cable', [
    'Arms nearly straight throughout',
    'Hinge slightly at the hips',
    'Sweep the bar to your thighs',
  ]],
  ['Dumbbell Pullover', 'lats', ['chest', 'triceps'], 'dumbbell', [
    'Hold one dumbbell over chest',
    'Lower behind head with soft elbows',
    'Pull back over chest using lats',
  ]],
  ['Band Lat Pulldown', 'lats', ['biceps'], 'band', [
    'Anchor band high',
    'Pull elbows down to your sides',
    'Control the return',
  ]],

  // ---------- Upper back ----------
  ['Barbell Row', 'upperBack', ['lats', 'biceps', 'lowerBack'], 'barbell', [
    'Hinge to about 45°, flat back',
    'Pull bar to lower ribs',
    'Squeeze shoulder blades at the top',
  ]],
  ['Pendlay Row', 'upperBack', ['lats', 'biceps', 'lowerBack'], 'barbell', [
    'Torso near parallel to the floor',
    'Bar starts dead on the floor each rep',
    'Pull explosively to lower chest',
  ]],
  ['One-Arm Dumbbell Row', 'upperBack', ['lats', 'biceps'], 'dumbbell', [
    'Hand and knee on bench, flat back',
    'Pull dumbbell toward your hip',
    'Avoid twisting the torso',
  ]],
  ['Chest-Supported Dumbbell Row', 'upperBack', ['lats', 'biceps'], 'dumbbell', [
    'Lie chest-down on an incline bench',
    'Pull elbows back past your torso',
    'Pause and squeeze at the top',
  ]],
  ['Seated Cable Row', 'upperBack', ['lats', 'biceps'], 'cable', [
    'Sit tall, slight knee bend',
    'Pull handle to your stomach',
    'Squeeze shoulder blades together',
  ]],
  ['T-Bar Row', 'upperBack', ['lats', 'biceps', 'lowerBack'], 'barbell', [
    'Hinge with a flat back',
    'Pull handle to your chest',
    'Lower under control',
  ]],
  ['Machine Row', 'upperBack', ['lats', 'biceps'], 'machine', [
    'Chest against the pad',
    'Pull elbows straight back',
    'Pause before returning',
  ]],
  ['Seal Row', 'upperBack', ['lats', 'biceps'], 'barbell', [
    'Lie face-down on a raised bench',
    'Pull bar to the bench',
    'No hip or leg drive',
  ]],
  ['Meadows Row', 'upperBack', ['lats', 'biceps'], 'barbell', [
    'Stand side-on to a landmine',
    'Grip the sleeve overhand',
    'Pull elbow high and back',
  ]],
  ['Kettlebell Row', 'upperBack', ['lats', 'biceps'], 'kettlebell', [
    'Staggered stance, flat back',
    'Pull kettlebell to your hip',
    'Lower to a full stretch',
  ]],
  ['Inverted Row', 'upperBack', ['lats', 'biceps'], 'bodyweight', [
    'Body straight from heels to head',
    'Pull chest to the bar',
    'Lower slowly to full arm extension',
  ]],
  ['Band Row', 'upperBack', ['lats', 'biceps'], 'band', [
    'Anchor band at chest height',
    'Pull elbows back past your torso',
    'Squeeze shoulder blades together',
  ]],

  // ---------- Lower back ----------
  ['Deadlift', 'lowerBack', ['glutes', 'hamstrings', 'traps', 'forearms'], 'barbell', [
    'Bar over mid-foot, shins close',
    'Brace hard, flat back',
    'Push the floor away',
    'Lock out with glutes, not by leaning back',
  ]],
  ['Rack Pull', 'lowerBack', ['glutes', 'traps', 'forearms'], 'barbell', [
    'Bar set just below or above the knees',
    'Brace and keep a flat back',
    'Drive hips forward to lock out',
  ]],
  ['Back Extension', 'lowerBack', ['glutes', 'hamstrings'], 'bodyweight', [
    'Pad just below the hip crease',
    'Hinge down with a flat back',
    'Rise until body is in line, no further',
  ]],
  ['Reverse Hyperextension', 'lowerBack', ['glutes', 'hamstrings'], 'machine', [
    'Lie face-down, hips at the edge',
    'Swing legs up to body height',
    'Control the way down',
  ]],
  ['Superman', 'lowerBack', ['glutes'], 'bodyweight', [
    'Lie face-down, arms overhead',
    'Lift arms, chest, and legs together',
    'Hold briefly at the top',
  ]],

  // ---------- Traps ----------
  ['Barbell Shrug', 'traps', ['forearms'], 'barbell', [
    'Stand tall, arms straight',
    'Shrug straight up toward ears',
    'Pause at the top, no rolling',
  ]],
  ['Dumbbell Shrug', 'traps', ['forearms'], 'dumbbell', [
    'Dumbbells at your sides',
    'Lift shoulders straight up',
    'Lower slowly',
  ]],
  ['Cable Shrug', 'traps', ['forearms'], 'cable', [
    'Bar attached to a low pulley',
    'Shrug straight up',
    'Hold the squeeze for a second',
  ]],
  ['Machine Shrug', 'traps', ['forearms'], 'machine', [
    'Stand tall under the pads',
    'Shrug straight up',
    'Control the stretch at the bottom',
  ]],
  ['Upright Row', 'traps', ['shoulders', 'biceps'], 'barbell', [
    'Grip about shoulder width',
    'Lead with the elbows',
    'Stop at chest height',
  ]],

  // ---------- Shoulders ----------
  ['Overhead Press', 'shoulders', ['triceps', 'traps'], 'barbell', [
    'Squeeze glutes and brace',
    'Press bar straight up past your face',
    'Push head through at lockout',
  ]],
  ['Seated Dumbbell Shoulder Press', 'shoulders', ['triceps'], 'dumbbell', [
    'Back against an upright bench',
    'Start at ear height',
    'Press up without clanking the weights',
  ]],
  ['Arnold Press', 'shoulders', ['triceps'], 'dumbbell', [
    'Start palms facing you at chin height',
    'Rotate palms forward as you press',
    'Reverse the rotation on the way down',
  ]],
  ['Push Press', 'shoulders', ['triceps', 'quads'], 'barbell', [
    'Short dip at the knees',
    'Drive up hard with the legs',
    'Finish the press with the arms',
  ]],
  ['Machine Shoulder Press', 'shoulders', ['triceps'], 'machine', [
    'Handles at about shoulder height',
    'Keep back against the pad',
    'Press without locking out hard',
  ]],
  ['Landmine Press', 'shoulders', ['chest', 'triceps'], 'barbell', [
    'Hold bar end at shoulder',
    'Press up and slightly forward',
    'Brace your core throughout',
  ]],
  ['Kettlebell Overhead Press', 'shoulders', ['triceps'], 'kettlebell', [
    'Kettlebell rests on the back of the forearm',
    'Press straight up, rotating palm forward',
    'Lock out with biceps by your ear',
  ]],
  ['Pike Push-Up', 'shoulders', ['triceps'], 'bodyweight', [
    'Hips high, body in an upside-down V',
    'Lower head toward the floor',
    'Press back up through the shoulders',
  ]],
  ['Dumbbell Lateral Raise', 'shoulders', ['traps'], 'dumbbell', [
    'Slight bend in elbows',
    'Raise out to the side to shoulder height',
    'Lead with elbows, not hands',
  ]],
  ['Cable Lateral Raise', 'shoulders', ['traps'], 'cable', [
    'Pulley low, cable across your body',
    'Raise to shoulder height',
    'Lower slowly',
  ]],
  ['Machine Lateral Raise', 'shoulders', ['traps'], 'machine', [
    'Pivot lined up with your shoulder',
    'Raise to shoulder height',
    'Pause briefly at the top',
  ]],
  ['Dumbbell Front Raise', 'shoulders', ['chest'], 'dumbbell', [
    'Arms nearly straight',
    'Raise to eye level',
    'No swinging',
  ]],
  ['Plate Front Raise', 'shoulders', ['chest'], 'other', [
    'Hold plate at the sides',
    'Raise to eye level',
    'Lower under control',
  ]],
  ['Rear Delt Fly', 'shoulders', ['upperBack'], 'dumbbell', [
    'Hinge forward with a flat back',
    'Raise arms out wide',
    'Lead with the pinkies',
  ]],
  ['Reverse Pec Deck', 'shoulders', ['upperBack'], 'machine', [
    'Face the pad, handles at shoulder height',
    'Sweep arms back in an arc',
    'Keep shoulders down',
  ]],
  ['Cable Rear Delt Fly', 'shoulders', ['upperBack'], 'cable', [
    'Cross the cables at shoulder height',
    'Pull arms out and back',
    'Keep a slight bend in the elbows',
  ]],
  ['Face Pull', 'shoulders', ['upperBack', 'traps'], 'cable', [
    'Rope at upper chest to face height',
    'Pull toward your forehead',
    'Spread the rope and rotate hands back',
  ]],
  ['Band Pull-Apart', 'shoulders', ['upperBack'], 'band', [
    'Arms straight at shoulder height',
    'Pull band apart to your chest',
    'Squeeze shoulder blades',
  ]],

  // ---------- Biceps ----------
  ['Barbell Curl', 'biceps', ['forearms'], 'barbell', [
    'Elbows pinned at your sides',
    'Curl without swinging',
    'Lower all the way down',
  ]],
  ['EZ-Bar Curl', 'biceps', ['forearms'], 'barbell', [
    'Grip on the angled part of the bar',
    'Keep elbows still',
    'Squeeze at the top',
  ]],
  ['Dumbbell Curl', 'biceps', ['forearms'], 'dumbbell', [
    'Palms forward or rotate as you curl',
    'Keep elbows at your sides',
    'Control the way down',
  ]],
  ['Hammer Curl', 'biceps', ['forearms'], 'dumbbell', [
    'Palms facing each other',
    'Curl without moving elbows',
    'Lower slowly',
  ]],
  ['Incline Dumbbell Curl', 'biceps', ['forearms'], 'dumbbell', [
    'Bench at about 45°',
    'Let arms hang straight down',
    'Curl without bringing elbows forward',
  ]],
  ['Preacher Curl', 'biceps', ['forearms'], 'barbell', [
    'Armpits snug against the pad',
    'Lower to almost straight',
    "Don't let the weight drop",
  ]],
  ['Dumbbell Preacher Curl', 'biceps', ['forearms'], 'dumbbell', [
    'One arm on the pad',
    'Lower to almost straight',
    'Squeeze at the top',
  ]],
  ['Concentration Curl', 'biceps', [], 'dumbbell', [
    'Seated, elbow against inner thigh',
    'Curl toward your shoulder',
    'Squeeze at the top',
  ]],
  ['Spider Curl', 'biceps', [], 'dumbbell', [
    'Lie chest-down on an incline bench',
    'Arms hang straight down',
    'Curl without moving upper arms',
  ]],
  ['Cable Curl', 'biceps', ['forearms'], 'cable', [
    'Straight bar on a low pulley',
    'Elbows at your sides',
    'Squeeze at the top',
  ]],
  ['Bayesian Cable Curl', 'biceps', [], 'cable', [
    'Face away from a low pulley',
    'Let arm drift behind you for a stretch',
    'Curl forward without moving the elbow',
  ]],
  ['Machine Curl', 'biceps', [], 'machine', [
    'Elbows lined up with the pivot',
    'Curl through full range',
    'Lower slowly',
  ]],
  ['Band Curl', 'biceps', ['forearms'], 'band', [
    'Stand on the band',
    'Elbows at your sides',
    'Control the return',
  ]],

  // ---------- Triceps ----------
  ['Close-Grip Bench Press', 'triceps', ['chest', 'shoulders'], 'barbell', [
    'Hands about shoulder width',
    'Elbows tucked close to your sides',
    'Lower to lower chest',
  ]],
  ['Skull Crusher', 'triceps', [], 'barbell', [
    'Upper arms angled slightly back',
    'Lower bar toward forehead or just behind',
    'Extend using only the elbows',
  ]],
  ['JM Press', 'triceps', ['chest'], 'barbell', [
    'Close grip, elbows forward',
    'Lower bar toward your chin',
    'Press back up along the same path',
  ]],
  ['Triceps Pushdown', 'triceps', [], 'cable', [
    'Elbows pinned at your sides',
    'Push down to full lockout',
    'Let forearms rise to parallel only',
  ]],
  ['Rope Pushdown', 'triceps', [], 'cable', [
    'Elbows pinned at your sides',
    'Spread the rope at the bottom',
    'Control the return',
  ]],
  ['Single-Arm Cable Pushdown', 'triceps', [], 'cable', [
    'Use a single handle',
    'Elbow fixed at your side',
    'Extend fully at the bottom',
  ]],
  ['Overhead Cable Triceps Extension', 'triceps', [], 'cable', [
    'Face away from the pulley',
    'Elbows pointing forward, close to head',
    'Extend fully overhead',
  ]],
  ['Overhead Dumbbell Triceps Extension', 'triceps', [], 'dumbbell', [
    'Hold one dumbbell overhead with both hands',
    'Lower behind your head',
    'Keep elbows narrow',
  ]],
  ['Dumbbell Kickback', 'triceps', [], 'dumbbell', [
    'Hinge forward, upper arm parallel to floor',
    'Extend the elbow straight back',
    'Keep the upper arm still',
  ]],
  ['Machine Triceps Extension', 'triceps', [], 'machine', [
    'Elbows lined up with the pivot',
    'Extend to full lockout',
    'Lower slowly',
  ]],
  ['Triceps Dip', 'triceps', ['chest', 'shoulders'], 'bodyweight', [
    'Torso upright',
    'Lower until elbows reach about 90°',
    'Press to full lockout',
  ]],
  ['Bench Dip', 'triceps', ['chest'], 'bodyweight', [
    'Hands on bench behind you',
    'Lower until elbows reach about 90°',
    'Keep hips close to the bench',
  ]],
  ['Diamond Push-Up', 'triceps', ['chest'], 'bodyweight', [
    'Hands together under your chest',
    'Elbows close to your sides',
    'Body in one straight line',
  ]],
  ['Band Pushdown', 'triceps', [], 'band', [
    'Anchor band high',
    'Elbows pinned at your sides',
    'Extend to full lockout',
  ]],

  // ---------- Forearms ----------
  ['Barbell Wrist Curl', 'forearms', [], 'barbell', [
    'Forearms on thighs, palms up',
    'Let the bar roll to your fingers',
    'Curl wrists up fully',
  ]],
  ['Reverse Wrist Curl', 'forearms', [], 'barbell', [
    'Forearms on thighs, palms down',
    'Raise the back of the hand',
    'Use a light weight',
  ]],
  ['Reverse Curl', 'forearms', ['biceps'], 'barbell', [
    'Overhand grip',
    'Elbows at your sides',
    'Keep wrists straight',
  ]],
  ["Farmer's Carry", 'forearms', ['traps', 'abs'], 'dumbbell', [
    'Stand tall, shoulders back',
    'Grip hard',
    'Short, quick steps',
  ]],
  ['Dead Hang', 'forearms', ['lats'], 'bodyweight', [
    'Hang from a bar, arms straight',
    'Shoulders active, not shrugged',
    'Hold for time',
  ]],
  ['Plate Pinch', 'forearms', [], 'other', [
    'Pinch two plates smooth side out',
    'Stand tall',
    'Hold for time',
  ]],

  // ---------- Abs ----------
  ['Plank', 'abs', ['shoulders'], 'bodyweight', [
    'Elbows under shoulders',
    'Squeeze glutes, tuck pelvis slightly',
    'Body in one straight line',
  ]],
  ['Side Plank', 'abs', ['glutes'], 'bodyweight', [
    'Elbow under shoulder',
    'Hips high, body straight',
    'Hold, then switch sides',
  ]],
  ['Crunch', 'abs', [], 'bodyweight', [
    'Knees bent, feet flat',
    'Curl ribs toward hips',
    "Don't pull on your neck",
  ]],
  ['Bicycle Crunch', 'abs', [], 'bodyweight', [
    'Bring elbow toward the opposite knee',
    'Extend the other leg fully',
    'Move slowly',
  ]],
  ['Decline Sit-Up', 'abs', [], 'bodyweight', [
    'Feet locked on a decline bench',
    'Curl up one vertebra at a time',
    'Lower under control',
  ]],
  ['Cable Crunch', 'abs', [], 'cable', [
    'Kneel facing a high pulley',
    'Hold the rope by your head',
    'Curl ribs toward hips, hips stay still',
  ]],
  ['Machine Crunch', 'abs', [], 'machine', [
    'Adjust pads to chest height',
    'Curl forward using the abs',
    'Return slowly',
  ]],
  ['Hanging Leg Raise', 'abs', ['forearms'], 'bodyweight', [
    'Hang with straight arms',
    'Raise legs without swinging',
    'Tilt the pelvis up at the top',
  ]],
  ['Hanging Knee Raise', 'abs', ['forearms'], 'bodyweight', [
    'Hang with straight arms',
    'Pull knees toward your chest',
    'Lower slowly, no swinging',
  ]],
  ['Lying Leg Raise', 'abs', [], 'bodyweight', [
    'Lower back pressed into the floor',
    'Raise legs to vertical',
    'Lower without arching',
  ]],
  ['Ab Wheel Rollout', 'abs', ['shoulders', 'lats'], 'other', [
    'Start on knees, hips tucked',
    'Roll out as far as you can stay flat',
    'Pull back with the abs',
  ]],
  ['Russian Twist', 'abs', [], 'bodyweight', [
    'Lean back, chest up',
    'Rotate from the torso',
    'Touch the floor each side',
  ]],
  ['Pallof Press', 'abs', [], 'cable', [
    'Stand side-on to the pulley',
    'Press the handle straight out',
    'Resist rotation',
  ]],
  ['Cable Woodchop', 'abs', ['shoulders'], 'cable', [
    'Pulley high, stand side-on',
    'Chop diagonally across your body',
    'Rotate through the torso and hips',
  ]],
  ['Dead Bug', 'abs', [], 'bodyweight', [
    'Lower back flat on the floor',
    'Extend opposite arm and leg',
    'Move slowly and breathe out',
  ]],
  ['Bird Dog', 'abs', ['lowerBack', 'glutes'], 'bodyweight', [
    'On hands and knees, flat back',
    'Extend opposite arm and leg',
    'Keep hips level',
  ]],
  ['Mountain Climber', 'abs', ['shoulders'], 'bodyweight', [
    'Start in a push-up position',
    'Drive knees toward your chest',
    'Keep hips low',
  ]],

  // ---------- Quads ----------
  ['Back Squat', 'quads', ['glutes', 'hamstrings', 'lowerBack'], 'barbell', [
    'Bar on upper back, brace hard',
    'Knees track over toes',
    'Hips to at least parallel',
    'Drive up through mid-foot',
  ]],
  ['Front Squat', 'quads', ['glutes', 'abs'], 'barbell', [
    'Bar on front of shoulders, elbows high',
    'Stay upright',
    'Sit straight down between your heels',
  ]],
  ['Box Squat', 'quads', ['glutes', 'hamstrings'], 'barbell', [
    'Sit back to the box under control',
    'Pause briefly without relaxing',
    'Drive up through the heels',
  ]],
  ['Barbell Lunge', 'quads', ['glutes'], 'barbell', [
    'Long enough step for a 90° front knee',
    'Back knee just above the floor',
    'Push through the front heel',
  ]],
  ['Smith Machine Squat', 'quads', ['glutes'], 'machine', [
    'Feet slightly in front of the bar',
    'Squat to at least parallel',
    'Drive up through mid-foot',
  ]],
  ['Hack Squat', 'quads', ['glutes'], 'machine', [
    'Back flat against the pad',
    'Feet shoulder width on the platform',
    'Lower deep, knees over toes',
  ]],
  ['Pendulum Squat', 'quads', ['glutes'], 'machine', [
    'Shoulders under the pads',
    'Sink deep with control',
    'Drive up through the whole foot',
  ]],
  ['Belt Squat', 'quads', ['glutes'], 'machine', [
    'Belt around hips',
    'Stay upright',
    'Squat to full depth',
  ]],
  ['Leg Press', 'quads', ['glutes', 'hamstrings'], 'machine', [
    'Feet shoulder width, mid-platform',
    "Lower until hips start to tuck, then stop",
    "Don't lock knees at the top",
  ]],
  ['Leg Extension', 'quads', [], 'machine', [
    'Knee lined up with the pivot',
    'Extend fully and squeeze',
    'Lower slowly',
  ]],
  ['Goblet Squat', 'quads', ['glutes', 'abs'], 'dumbbell', [
    'Hold the dumbbell at your chest',
    'Elbows inside the knees at the bottom',
    'Stay upright',
  ]],
  ['Kettlebell Goblet Squat', 'quads', ['glutes', 'abs'], 'kettlebell', [
    'Hold kettlebell by the horns at your chest',
    'Sit between your heels',
    'Drive up, chest tall',
  ]],
  ['Bulgarian Split Squat', 'quads', ['glutes'], 'dumbbell', [
    'Rear foot on a bench',
    'Drop the back knee straight down',
    'Drive through the front heel',
  ]],
  ['Walking Lunge', 'quads', ['glutes', 'hamstrings'], 'dumbbell', [
    'Long, controlled steps',
    'Back knee just above the floor',
    'Stay upright',
  ]],
  ['Reverse Lunge', 'quads', ['glutes'], 'dumbbell', [
    'Step straight back',
    'Lower until both knees are about 90°',
    'Push through the front heel to return',
  ]],
  ['Step-Up', 'quads', ['glutes'], 'dumbbell', [
    'Whole foot on the box',
    'Drive up through the top leg only',
    'Lower slowly',
  ]],
  ['Sissy Squat', 'quads', [], 'bodyweight', [
    'Hold something for balance',
    'Lean back as knees travel forward',
    'Keep hips extended',
  ]],
  ['Bodyweight Squat', 'quads', ['glutes'], 'bodyweight', [
    'Feet shoulder width',
    'Sit to at least parallel',
    'Chest up, knees out',
  ]],
  ['Wall Sit', 'quads', ['glutes'], 'bodyweight', [
    'Back flat on the wall',
    'Thighs parallel to the floor',
    'Hold for time',
  ]],

  // ---------- Hamstrings ----------
  ['Romanian Deadlift', 'hamstrings', ['glutes', 'lowerBack'], 'barbell', [
    'Soft knees, push hips back',
    'Bar slides down the thighs',
    'Stop at a hamstring stretch, flat back',
  ]],
  ['Dumbbell Romanian Deadlift', 'hamstrings', ['glutes', 'lowerBack'], 'dumbbell', [
    'Dumbbells close to the legs',
    'Push hips back with soft knees',
    'Stand by driving hips forward',
  ]],
  ['Single-Leg Romanian Deadlift', 'hamstrings', ['glutes'], 'dumbbell', [
    'Hinge on one leg, the other reaches back',
    'Keep hips square',
    'Stop at a hamstring stretch',
  ]],
  ['Stiff-Leg Deadlift', 'hamstrings', ['glutes', 'lowerBack'], 'barbell', [
    'Legs nearly straight',
    'Hinge at the hips with a flat back',
    'Lower to a deep stretch',
  ]],
  ['Good Morning', 'hamstrings', ['lowerBack', 'glutes'], 'barbell', [
    'Bar on upper back',
    'Push hips back, slight knee bend',
    'Stop when torso nears parallel',
  ]],
  ['Lying Leg Curl', 'hamstrings', ['calves'], 'machine', [
    'Knees just off the pad edge',
    'Curl heels toward glutes',
    'Keep hips pressed down',
  ]],
  ['Seated Leg Curl', 'hamstrings', ['calves'], 'machine', [
    'Thigh pad snug',
    'Curl all the way under',
    'Lower slowly',
  ]],
  ['Standing Leg Curl', 'hamstrings', [], 'machine', [
    'Knee lined up with the pivot',
    'Curl heel toward glute',
    'Keep hips still',
  ]],
  ['Nordic Hamstring Curl', 'hamstrings', [], 'bodyweight', [
    'Ankles anchored, kneeling',
    'Lower as slowly as you can',
    'Body straight from knees to head',
  ]],
  ['Glute-Ham Raise', 'hamstrings', ['glutes'], 'machine', [
    'Knees just behind the pad',
    'Lower with a straight body',
    'Curl back up with the hamstrings',
  ]],
  ['Stability Ball Leg Curl', 'hamstrings', ['glutes'], 'other', [
    'Heels on the ball, hips raised',
    'Roll the ball toward you',
    'Keep hips up throughout',
  ]],

  // ---------- Glutes ----------
  ['Barbell Hip Thrust', 'glutes', ['hamstrings'], 'barbell', [
    'Upper back on a bench, bar on hips',
    'Chin tucked',
    'Drive hips up to full lockout',
    'Pause and squeeze at the top',
  ]],
  ['Machine Hip Thrust', 'glutes', ['hamstrings'], 'machine', [
    'Pad across the hips',
    'Drive up to full lockout',
    'Squeeze at the top',
  ]],
  ['Single-Leg Hip Thrust', 'glutes', ['hamstrings'], 'bodyweight', [
    'Upper back on a bench',
    'Drive through one heel',
    'Keep hips level',
  ]],
  ['Glute Bridge', 'glutes', ['hamstrings'], 'bodyweight', [
    'Lie on your back, knees bent',
    'Drive hips up',
    'Squeeze at the top',
  ]],
  ['Barbell Glute Bridge', 'glutes', ['hamstrings'], 'barbell', [
    'Back on the floor, bar on hips',
    'Drive hips up',
    'Pause at the top',
  ]],
  ['Sumo Deadlift', 'glutes', ['quads', 'hamstrings', 'lowerBack'], 'barbell', [
    'Wide stance, toes out',
    'Hands inside the knees',
    'Push knees out and the floor away',
  ]],
  ['Trap Bar Deadlift', 'glutes', ['quads', 'hamstrings', 'traps'], 'other', [
    'Stand centered in the bar',
    'Brace, flat back',
    'Drive through the floor to stand',
  ]],
  ['Kettlebell Swing', 'glutes', ['hamstrings', 'lowerBack'], 'kettlebell', [
    'Hinge, not squat',
    'Snap hips forward',
    'Let arms float the bell to chest height',
  ]],
  ['Cable Pull-Through', 'glutes', ['hamstrings'], 'cable', [
    'Face away from a low pulley',
    'Hinge back with a flat back',
    'Drive hips forward to stand',
  ]],
  ['Cable Kickback', 'glutes', ['hamstrings'], 'cable', [
    'Ankle strap on a low pulley',
    'Kick back without arching',
    'Squeeze at the end',
  ]],
  ['Hip Abduction Machine', 'glutes', [], 'machine', [
    'Sit tall',
    'Push knees out against the pads',
    'Return slowly',
  ]],
  ['Curtsy Lunge', 'glutes', ['quads'], 'dumbbell', [
    'Step back and across behind you',
    'Lower with control',
    'Drive through the front heel',
  ]],
  ['Band Lateral Walk', 'glutes', [], 'band', [
    'Band around knees or ankles',
    'Half-squat position',
    'Step sideways, keep tension',
  ]],

  // ---------- Calves ----------
  ['Standing Calf Raise', 'calves', [], 'machine', [
    'Balls of feet on the edge',
    'Full stretch at the bottom',
    'Rise as high as possible and pause',
  ]],
  ['Seated Calf Raise', 'calves', [], 'machine', [
    'Pad snug on the knees',
    'Lower to a deep stretch',
    'Pause at the top',
  ]],
  ['Leg Press Calf Raise', 'calves', [], 'machine', [
    'Balls of feet on the platform edge',
    'Keep knees nearly straight',
    'Full range, slow',
  ]],
  ['Smith Machine Calf Raise', 'calves', [], 'machine', [
    'Stand on a plate or step',
    'Full stretch at the bottom',
    'Pause at the top',
  ]],
  ['Donkey Calf Raise', 'calves', [], 'machine', [
    'Hinge forward, back flat',
    'Lower heels for a deep stretch',
    'Rise high and squeeze',
  ]],
  ['Single-Leg Dumbbell Calf Raise', 'calves', [], 'dumbbell', [
    'Hold a dumbbell on the working side',
    'Stand on a step on one foot',
    'Full range, slow',
  ]],
  ['Bodyweight Calf Raise', 'calves', [], 'bodyweight', [
    'Stand on a step',
    'Lower heels below the step',
    'Rise high and pause',
  ]],
];

export type SeedExercise = {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: Equipment;
  cues: string[];
};

export function seedId(name: string): string {
  return (
    'seed-' +
    name
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export const SEED_EXERCISES: SeedExercise[] = ROWS.map(([name, primary, secondary, equipment, cues]) => ({
  id: seedId(name),
  name,
  primary,
  secondary,
  equipment,
  cues,
}));

export const SEED_BY_ID: ReadonlyMap<string, SeedExercise> = new Map(SEED_EXERCISES.map((e) => [e.id, e]));
