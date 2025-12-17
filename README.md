# CP22 DOCKER CONTAINERS TESTING README

## DOCKER SETUP
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo service docker start
sudo usermod -aG docker $USER
newgrp docker
sudo systemctl start docker

## FOR SIMULATION
**simply :**
cd ~/ros2_ws/src/fastbot_ros2_docker/simulation

**then :**
docker-compose up


## FOR THE REAL ROBOT

### In the Fastbot
**repo cloning cmd:**
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export CYCLONEDDS_URI=file:///var/lib/theconstruct.rrl/cyclonedds_husarnet.xml
cd ~/ros2_ws/src/
git clone https://github.com/emericstrongkiller/fastbot_ros2_docker.git

**Pulling containers cmds:**
sudo docker pull emericstrongkiller/emericstrongkiller-cp22:fastbot-ros2-real
sudo docker pull emericstrongkiller/emericstrongkiller-cp22:fastbot-ros2-slam-real

**Containers compose cmds:**
cd ~/ros2_ws/src/fastbot_ros2_docker/real
sudo docker-compose up

### In the Rosject
**After Connecting to the fastbot:**
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export CYCLONEDDS_URI=file:///var/lib/theconstruct.rrl/cyclonedds.xml
cd ~/ros2_ws/src/fastbot_ros2_docker/real
rviz2 -d fastbot_rviz_config.rviz



## PS:
**=> Usually, the map doesn't show up the first time docker-compose up runs, thus, in the Fastbot, again:**
*Ctrl+C*
sudo docker-compose up