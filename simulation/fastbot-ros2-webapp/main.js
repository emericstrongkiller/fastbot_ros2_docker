let vueApp = new Vue({
    el: "#vueApp",
    data: {
        // ros connection
        ros: null,
        cmdVelTopic: null,
        loading: false,
        rosbridge_address: '',
        connected: false,
        // subscriber data
        position: { x: 0, y: 0, z: 0 },
        orientation: 0,
        speeds: { linear_x: 0, linear_y: 0, angular_z: 0 },
        // previous values for speed calculation
        prevPosition: { x: 0, y: 0, z: 0 },
        prevOrientation: 0,
        prevTimestamp: 0,
        firstUpdate: true,
        // page content
        menu_title: 'Connection',
        main_title: 'Fastbot live infos',
        // dragging data
        dragging: false,
        x: 'no',
        y: 'no',
        dragCircleStyle: {
            margin: '0px',
            top: '0px',
            left: '0px',
            display: 'none',
            width: '75px',
            height: '75px'
        },
        // joystick values
        joystick: {
            vertical: 0,
            horizontal: 0
        },
        // publisher
        pubInterval: null,
        // map related attributes
        mapViewer: null,
        mapGridClient: null,
        interval: null,
        // goal publisher (if you want to keep a reference)
        goal_publisher: null
    },
    methods: {
        connect: function () {
            this.loading = true
            this.ros = new ROSLIB.Ros({
                url: this.rosbridge_address,
                groovyCompatibility: false
            })
            this.ros.on('connection', () => {
                console.log('ROSBridge Connected !')
                this.connected = true
                this.loading = false

                // CREATE AND ADVERTISE ONCE
                this.cmdVelTopic = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/fastbot/cmd_vel',
                    messageType: 'geometry_msgs/msg/Twist'
                })
                this.cmdVelTopic.advertise()

                // Subscribe to odometry
                let odomTopic = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/fastbot/odom',
                    messageType: 'nav_msgs/Odometry'
                })
                odomTopic.subscribe((message) => {
                    // Update position and orientation
                    this.position = message.pose.pose.position
                    const q = message.pose.pose.orientation
                    this.orientation = this.quaternionToYaw(q.x, q.y, q.z, q.w)

                    // Calculate speeds from position changes
                    this.calculateSpeeds()

                    // Update previous values for next calculation
                    this.prevPosition = { ...this.position }
                    this.prevOrientation = this.orientation
                    this.prevTimestamp = Date.now() / 1000 // seconds
                })

                // Start publishing joystick commands
                this.pubInterval = setInterval(this.publish, 100)

                // Map setup
                this.mapViewer = new ROS2D.Viewer({
                    divID: 'map',
                    width: 405,
                    height: 360
                })
                this.mapGridClient = new ROS2D.OccupancyGridClient({
                    ros: this.ros,
                    rootObject: this.mapViewer.scene,
                    continuous: true
                })
                this.mapGridClient.on('change', () => {
                    this.mapViewer.scaleToDimensions(
                        this.mapGridClient.currentGrid.width,
                        this.mapGridClient.currentGrid.height
                    )
                    this.mapViewer.shift(
                        this.mapGridClient.currentGrid.pose.position.x,
                        this.mapGridClient.currentGrid.pose.position.y
                    )
                })
            })
            this.ros.on('error', (error) => {
                console.log('Something went wrong when trying to connect')
            })
            this.ros.on('close', () => {
                console.log('Connection to ROSBridge was closed!')
                this.connected = false
                clearInterval(this.pubInterval)
                this.loading = false
                document.getElementById('map').innerHTML = ''
            })
        },
        calculateSpeeds: function () {
            const currentTime = Date.now() / 1000 // Convert to seconds

            // Skip first update (no previous data)
            if (this.firstUpdate) {
                this.firstUpdate = false
                this.prevPosition = { ...this.position }
                this.prevOrientation = this.orientation
                this.prevTimestamp = currentTime
                return
            }

            const deltaTime = currentTime - this.prevTimestamp

            // Avoid division by zero
            if (deltaTime <= 0) return

            // Calculate linear speeds
            const deltaX = this.position.x - this.prevPosition.x
            const deltaY = this.position.y - this.prevPosition.y

            this.speeds.linear_x = deltaX / deltaTime
            this.speeds.linear_y = deltaY / deltaTime

            // Calculate angular speed (handle angle wrapping)
            let deltaTheta = this.orientation - this.prevOrientation

            // Handle angle wrapping (-π to π)
            if (deltaTheta > Math.PI) {
                deltaTheta -= 2 * Math.PI
            } else if (deltaTheta < -Math.PI) {
                deltaTheta += 2 * Math.PI
            }

            this.speeds.angular_z = deltaTheta / deltaTime
        },

        disconnect: function () {
            this.ros.close()
            // Reset calculation variables
            this.firstUpdate = true
        },

        publish: function () {
            if (!this.cmdVelTopic) return;  // safety check

            this.cmdVelTopic.publish(new ROSLIB.Message({
                linear: { x: this.joystick.vertical, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: this.joystick.horizontal }
            }));
        },
        sendCommand: function () {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/fastbot/cmd_vel',
                messageType: 'geometry_msgs/msg/Twist'
            })
            /*
            let message = new ROSLIB.Message({
                linear: { x: 0.2, y: 0, z: 0, },
                angular: { x: 0, y: 0, z: 0.5, },
            })
            topic.publish(message)
            */
        },
        turnRight: function () {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/fastbot/cmd_vel',
                messageType: 'geometry_msgs/msg/Twist'
            })
            let message = new ROSLIB.Message({
                linear: { x: 0.2, y: 0, z: 0, },
                angular: { x: 0, y: 0, z: -0.5, },
            })
            topic.publish(message)
        },
        stop: function () {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/fastbot/cmd_vel',
                messageType: 'geometry_msgs/msg/Twist'
            })
            let message = new ROSLIB.Message({
                linear: { x: 0, y: 0, z: 0, },
                angular: { x: 0, y: 0, z: 0, },
            })
            topic.publish(message)
        },
        startDrag() {
            this.dragging = true
            this.x = this.y = 0
        },
        stopDrag() {
            this.dragging = false
            this.x = this.y = 'no'
            this.dragCircleStyle.display = 'none'
            this.resetJoystickVals()
        },
        doDrag(event) {
            if (this.dragging) {
                this.x = event.offsetX
                this.y = event.offsetY
                let ref = document.getElementById('dragstartzone')
                this.dragCircleStyle.display = 'inline-block'

                let minTop = ref.offsetTop - parseInt(this.dragCircleStyle.height) / 2
                let maxTop = minTop + 200
                let top = this.y + minTop
                this.dragCircleStyle.top = `${top}px`

                let minLeft = ref.offsetLeft - parseInt(this.dragCircleStyle.width) / 2
                let maxLeft = minLeft + 200
                let left = this.x + minLeft
                this.dragCircleStyle.left = `${left}px`

                this.setJoystickVals()
            }
        },
        setJoystickVals() {
            this.joystick.vertical = -1 * ((this.y / 200) - 0.5)
            this.joystick.horizontal = -1 * ((this.x / 200) - 0.5)
        },
        resetJoystickVals() {
            this.joystick.vertical = 0
            this.joystick.horizontal = 0
        },
        // Convert quaternion (x, y, z, w) → yaw (theta in radians)
        quaternionToYaw: function (x, y, z, w) {
            // Yaw = rotation around Z axis
            const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
            return yaw
        },
        unset3DViewer() {
            document.getElementById('div3DViewer').innerHTML = ''
        },

        // user clickable goal publisher
        sofa_goal_publish() {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/goal_pose',
                messageType: 'geometry_msgs/msg/PoseStamped'
            })
            let message = new ROSLIB.Message({
                header: { stamp: { sec: 0 }, frame_id: 'map' }, pose: { position: { x: 0.711, y: 1.379, z: 0.0 }, orientation: { x: 0.0, y: 0.0, z: 0.801, w: 1.0 } }
            })
            topic.publish(message)
            console.log('JUST published sofa goal !')
        },
        kitchen_goal_publish() {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/goal_pose',
                messageType: 'geometry_msgs/msg/PoseStamped'
            })
            let message = new ROSLIB.Message({
                header: { stamp: { sec: 0 }, frame_id: 'map' }, pose: { position: { x: 1.095, y: -2.239, z: 0.0 }, orientation: { x: 0.0, y: 0.0, z: -0.198, w: 1.0 } }
            })
            topic.publish(message)
            console.log('JUST published sofa goal !')
        },
        living_room_goal_publish() {
            let topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/goal_pose',
                messageType: 'geometry_msgs/msg/PoseStamped'
            })
            let message = new ROSLIB.Message({
                header: { stamp: { sec: 0 }, frame_id: 'map' }, pose: { position: { x: -1.37, y: -1.87, z: 0.0 }, orientation: { x: 0.0, y: 0.0, z: -0.296, w: 1.0 } }
            })
            topic.publish(message)
            console.log('JUST published sofa goal !')
        },
    },
    mounted() {
        // page is ready
        console.log('page is ready!')
        window.addEventListener('mouseup', this.stopDrag)

        // map related
        this.interval = setInterval(() => {
            if (this.ros != null && this.ros.isConnected) {
                this.ros.getNodes((data) => { }, (error) => { })
            }
        }, 10000)
    },
})