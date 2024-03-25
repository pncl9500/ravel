debugVal = 1;
fcst = 1000 / 30;

//don't actually spawn this - just a template for new enemies.
class Generic extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("generic") - 1, radius, speed, angle, "#939393");
  }
}

//slooming enemy behaves strangely when tabbing out and tabbing back in and doesn't change size when hit by player bullets properly
//this is because im a dumbass and didn't use radius multiplied and set the fixedradius
//it was my first enemy type added cut me some slack
class Slooming extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("slooming") - 1, radius, speed, angle, "#8d78bf");

    this.maxRadius = this.radius * 3;
    this.minRadius = this.radius;
    this.clock = Math.random() * 2000;
  }
  //set this.fixedRadius to this.radius if you want to change size (note to future self)
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock % 2000 <= 1000){
      this.radius += ((this.maxRadius - this.radius) * 0.1) * (time / fcst);
    } else {
      this.radius += ((this.minRadius - this.radius) * 0.1) * (time / fcst);
    }
    if (this.radius > this.maxRadius){
      this.radius = this.maxRadius;
    }
    this.fixedRadius = this.radius;
  }
}

class Riptide extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 180) {
    super(pos, entityTypes.indexOf("riptide") - 1, radius, speed, angle, "#1e6378", true, "rgba(30, 100, 120, 0.15)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.riptide = true;
    }
  }
}

class Water_Trail extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("water_trail") - 1, radius, speed, angle, "#2c405e");
    this.clock = 0;
  }
  behavior(time, area, offset, players) {
    this.clock+=time;
    if (this.clock>=(1000)) {
        this.spawnTrail(area);
        this.clock=0;
    }
  }
  spawnTrail(area){
    const trail = new SpawnedWaterTrail(new Vector(this.pos.x,this.pos.y),this.radius / 2);
    if(!area.entities["water_trail"]){area.entities["water_trail"] = []}
    area.entities["water_trail"].push(trail);
  }
}

class SpawnedWaterTrail extends Enemy {
  constructor(pos, radius) {
    super(pos, entityTypes.indexOf("water_trail") - 1, radius, 0, undefined,"#1e6378");
    this.clock = 0;
    this.alpha = 1;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    this.radius += 0.04 * time / (1000 / 30);
    this.fixedRadius = this.radius;
    if(this.clock>=1000){
      this.alpha -= time/500;
      if(this.alpha<=0){this.alpha=0.001}
    }
    if(this.clock>=1500){
      this.toRemove = true;
    }
  }
}

//finish nightshade
class Nightshade extends Enemy {
  constructor(pos, radius, speed, angle, growthMultiplayer) { 
    super(pos, entityTypes.indexOf("nightshade") - 1, radius, speed, angle, "#29402c");
    this.id = 1;
    this.growthMultiplayer = growthMultiplayer;
    this.triggerZone = 250/32;
    this.baseColor = this.color;
    this.activeColor = "#dbc96e";
    this.colorShift = 0;
    this.targetColorShift = 0;
    this.newR = 0;
    this.newG = 0;
    this.newB = 0;
    this.baseRGB = hexToRgb(this.baseColor);
    this.activeRGB = hexToRgb(this.activeColor);
  }
  behavior(time, area, offset, players) {
    while(this.id<=5){
      this.spawnFlower(area,this.id);
      this.id++;
    }
    if (distance(players[0].pos, new Vector(this.pos.x + offset.x, this.pos.y + offset.y)) < players[0].radius + this.triggerZone && !players[0].safeZone && !players[0].night) {
      this.targetColorShift = 1;
    } else {
      this.targetColorShift = 0;
    }
    this.colorShift += (this.targetColorShift - this.colorShift) * 0.05;
    this.newR = Math.floor(this.baseRGB[0] * (1 - this.colorShift) + this.activeRGB[0] * this.colorShift);
    this.newG = Math.floor(this.baseRGB[1] * (1 - this.colorShift) + this.activeRGB[1] * this.colorShift);
    this.newB = Math.floor(this.baseRGB[2] * (1 - this.colorShift) + this.activeRGB[2] * this.colorShift);
    this.color = rgbToHex(this.newR, this.newG, this.newB);
  }
  spawnFlower(area, id){
    const nightshade_projectile = new NightshadeProjectile(new Vector(this.pos.x,this.pos.y),this.radius,id,this,this.growthMultiplayer);
    if(!area.entities["nightshade_projectile"]){area.entities["nightshade_projectile"] = []}
    area.entities["nightshade_projectile"].push(nightshade_projectile);
  }
}

class NightshadeProjectile extends Entity {
  constructor(pos, radius, id, spawner, growthMultiplayer = 2.5) {
    super(pos, radius, "#564375");
    this.id = id;
    this.spawner = spawner;
    this.no_collide = true;
    this.triggerZone = 250/32;
    this.radiusRatio = 0;
    this.growthMultiplayer = growthMultiplayer;
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    const growth = this.growthMultiplayer * 0.03;
    switch(this.id){
      case 1:
        this.pos = this.newPosition(1,-0.25);
        break;
      case 2:
        this.pos = this.newPosition(-1,-0.25);
        break;
      case 3:
        this.pos = this.newPosition(0,-1);
        break;
      case 4:
        this.pos = this.newPosition(0.6,0.9);
        break;
      case 5:
        this.pos = this.newPosition(-0.6,0.9);
        break;
    }
    if(this.spawner.Harmless){this.Harmless = true;}
    else{this.Harmless = false;}
    if (distance(players[0].pos, new Vector(this.spawner.pos.x + offset.x, this.spawner.pos.y + offset.y)) < players[0].radius + this.triggerZone && !players[0].safeZone && !players[0].night) {
      this.radiusRatio += growth / 2 * timeFix;
    } else {
      this.radiusRatio -= growth / 2 * timeFix;
    }
    if(this.radiusRatio < 0){
      this.radiusRatio = 0;
    }
    if(this.radiusRatio > 2){
      this.radiusRatio = 2;
    }
    this.radius *= this.radiusRatio;
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
  }
  newPosition(x,y){
    return new Vector(this.spawner.pos.x+x*this.radius,this.spawner.pos.y+y*this.radius)
  }
}

class Particulate extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("particulate") - 1, radius, speed, angle, "#8fb0db");
    this.speed = speed;
    this.time_to_prepare = 750;
    this.time_to_dash = 750;
    this.time_between_dashes = 750;
    this.normal_speed = speed;
    this.base_speed = this.normal_speed / 5;
    this.prepare_speed = this.normal_speed / 8;
    this.dash_speed = this.normal_speed;
    this.time_dashing = 0;
    this.time_preparing = 0;
    this.time_since_last_dash = 0;
    this.time_dashing = Math.floor(Math.random() * 750);
    this.velToAngle();
    this.oldAngle = this.angle;
    this.dasher = true;
  }
  compute_speed(){
    this.speed = (this.time_since_last_dash < this.time_between_dashes && this.time_dashing == 0 && this.time_preparing == 0) ? 0 : (this.time_dashing == 0) ? this.prepare_speed : this.base_speed//(this.time_preparing>0) ? this.prepare_speed : this.base_speed
    this.angleToVel();
    this.oldAngle = this.angle;
  }
  behavior(time, area, offset, players) {
    this.angle = this.oldAngle;
    if(this.time_preparing == 0){
      if(this.time_dashing == 0){
        if(this.time_since_last_dash < this.time_between_dashes){
          this.time_since_last_dash += time;
        }
        else{
          this.time_since_last_dash = 0;
          this.time_preparing += time;
          this.base_speed = this.prepare_speed;
          this.angle = Math.random() * 360;
        }
      }
      else {
        this.time_dashing += time;
        if (this.time_dashing > this.time_to_dash){
          this.time_dashing = 0;
          this.base_speed = this.normal_speed;
        } else {
          this.base_speed = this.dash_speed * ( 1 - (this.time_dashing / this.time_to_dash ) );
        }
      }
    } else {
      this.time_preparing += time;
      if (this.time_preparing > this.time_to_prepare){
        this.time_preparing = 0;
        this.time_dashing += time;
        this.base_speed = this.dash_speed;
      } else {
        this.base_speed = this.prepare_speed * ( 1 - (this.time_preparing / this.time_to_prepare) );
      }
    }
    this.compute_speed();
  }
}

class Cloud extends Enemy{
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("cloud") - 1, radius, speed, angle, "rgba(255, 255, 255, 0.5)");
    this.Harmless = true;
    this.imune = true;
    this.cloud = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      player.cloud = true;
    }
  }
}

class Rain extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("rain") - 1, radius, speed, angle, "rgba(20, 120, 130, 1)");
    this.Harmless = true;
  }
  behavior(time, area, offset, players){
    this.Harmless = true;
    this.speedMultiplier = 2;
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (entity.cloud){
          if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius) {
            this.Harmless = false;
            this.speedMultiplier = 1;
          }
        }
      }
    }
  }
}

class Storm extends Enemy{
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("cloud") - 1, radius, speed, angle, "rgba(80, 80, 80, 0.5)");
    this.Harmless = true;
    this.imune = true;
    this.cloud = true;
    this.interactedEntities = [];
  }
  behavior(time, area, offset, players){
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (entity.Harmless === false && entity.isEnemy){
          if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius) {
            if (!this.interactedEntities.includes(entity)){
              entity.inStorm = true;
            }
          }
        }
      }
    }
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      player.storm = true;
    }
  }
}

class Airburst extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("airburst") - 1, radius, speed, angle, "#263087");
    this.releaseTime = 2000;
    this.clock = Math.random() * this.releaseTime;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      for (var i = 0; i < 17; i++) {
        area.addSniperBullet(16, this.pos, i * Math.PI / 8, 8 / 32, 4)
      }
      this.clock = 0;
    }
  }
}

class AirburstBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#263087");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.clock=0;
  }
  interact(player, worldPos) {
    if(interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune).inDistance){
      this.toRemove = true;
    }
  }
  behavior(time){
    this.clock+=time
    if(this.clock>=3000){
      this.toRemove = true;
    }
  }
}

class Param_test extends Enemy {
  constructor(pos, radius, speed, angle, test_param = 2000) {
    super(pos, entityTypes.indexOf("param_test") - 1, radius, speed, angle, "#ff00ff");
    this.test_param = test_param;
    this.clock = Math.random() * test_param;
  }
  behavior(time, area, offset, players){
    this.clock += time;
    this.radiusMultiplier = (Math.sin(this.clock / this.test_param)) / 3 + 1;
  }
}

//1 rot speed = 15 degrees per second
class Rotor extends Enemy {
  constructor(pos, radius, speed, angle, rotor_branch_count = 2,rotor_node_count = 2,rotor_node_radius = 16,rotor_rot_speed = 5,rotor_reversed = false,rotor_branch_offset = 0, rotor_node_dist = 0, rotor_branch_dist = 0, rotor_offset_per_layer = 0, rotor_layer_reverse_interval = 0, rotor_corrosive = false) {
    super(pos, entityTypes.indexOf("generic") - 1, radius, speed, angle, "#43701e");
    this.branch_count = rotor_branch_count;
    this.node_count = rotor_node_count;
    this.node_radius = rotor_node_radius;
    this.rot_speed = rotor_rot_speed;
    this.reverse = rotor_reversed ? -1 : 1;
    this.branch_offset = rotor_branch_offset;
    this.node_dist = rotor_node_dist / 16;
    this.branch_dist = rotor_branch_dist / 16;
    this.offset_per_layer = rotor_offset_per_layer;
    this.layer_reverse_interval = rotor_layer_reverse_interval;
    this.corrosive = rotor_corrosive;
    if (this.corrosive){
      this.renderedAsRing = true;
      this.color = "#229111";
    }
    this.id = 0;
    this.clock = 0;
    this.imune = true;
    this.rotation = this.branch_offset;
  }
  behavior(time, area, offset, players){
    while(this.id < this.branch_count * this.node_count){
      this.spawnNode(area,this.id);
      this.id++;
    }
    this.rotation += this.reverse * (time / 60 / (1000 / 60)) * this.rot_speed * 15;
  }
  spawnNode(area, id){
    const rotor_node = new RotorNode(id, this);
    if(!area.entities["rotor_node"]){area.entities["rotor_node"] = []}
    area.entities["rotor_node"].push(rotor_node);
  }
}

class RotorNode extends Entity {
  constructor(id, parent) {
    super(new Vector(parent.pos.x, parent.pos.y), parent.node_radius / 32, "#315315");
    this.id = id;
    this.parent = parent;
    this.imune = true;
    this.corrosive = parent.corrosive;
    if (this.corrosive){
      this.renderedAsRing = true;
      this.color = "#229111";
    }
    this.layer_in_branch = Math.floor(id / parent.branch_count);
    this.position_in_branch = id % parent.branch_count;
    this.angle_btwn_branches = 360 / parent.branch_count;
    this.dist_from_center = this.layer_in_branch * (parent.node_radius / 8 / 2) + this.radius + parent.radius + parent.branch_dist + parent.node_dist * this.layer_in_branch;
    this.no_collide = true;
    this.outline = true;
    this.renderFirst = false;
    this.isEnemy = true;
  }
  behavior(time, area, offset, players) {
    this.branch_angle = this.angle_btwn_branches * this.position_in_branch + (this.layer_in_branch % ((this.parent.layer_reverse_interval) * 2) < this.parent.layer_reverse_interval ? -this.parent.rotation : this.parent.rotation) + this.parent.offset_per_layer * this.layer_in_branch;
    this.pos.x = this.parent.pos.x + this.dist_from_center * Math.cos(this.branch_angle * (Math.PI/180));
    this.pos.y = this.parent.pos.y + this.dist_from_center * Math.sin(this.branch_angle * (Math.PI/180));
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
  }
}

class RadioactiveSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("radioactive_sniper") - 1, radius, speed, angle, "#2c302d");
    this.releaseTime = 2000;
    this.clock = Math.random() * this.releaseTime;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      var min = 18.75;
      var index;
      var boundary = area.getActiveBoundary();
      for (var i in players) {
        if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min && pointInRectangle(new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
          min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
          index = i;
        }
      }
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(17, this.pos, Math.atan2(dY, dX), this.radius / 2, 17)
        this.clock = 0;
      }
    }
  }
}

class RadioactiveProjectile extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#c8f542");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.Harmless = false;
    this.clock = 0;
    this.maxLifetime = 1500;
    this.lightCount=this.radius*32+40;
    this.isLight = true;
    this.weak = true;
  }
  behavior(time, area, offset, players){
    this.clock += time;
    if (this.clock > this.maxLifetime){
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      if (player.energy <= 0){
        interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
        player.regenDisableTimer = 0;
      } else {
        player.energy = Math.min(0, 0);
        player.regenDisableTimer = 5000;
      }
      this.vel.x = Math.cos(0) * this.speed;
      this.vel.y = Math.sin(0) * this.speed;
      this.toRemove = true;
    }
  }
}

class Vine extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("vine") - 1, radius, speed, angle, "#5fa372");
    this.Harmless = true;    
    this.imune = true;
    this.spawnedProj = false;
  }
  behavior(time, area, offset, players){
    if (!this.spawnedProj){
      this.spawnedProj = true;
      this.spawnProjectile(area, offset);
    }
  }
  spawnProjectile(area, offset){
    const vine_projectile = new VineProjectile(this,this.radius);
    if(!area.entities["vine_projectile"]){area.entities["vine_projectile"] = []}
    area.entities["vine_projectile"].push(vine_projectile);
  }
}

class VineProjectile extends Entity{
  constructor(parent, radius) {
    super(parent.pos, radius, "#5fa372");
    this.parent = parent;
    this.outline = true;
    this.renderFirst = false;
    this.isEnemy = true;
    this.imune = false;
    this.off = new Vector(0,0);
    this.detectionRadius = 250/32 + parent.radius;
    this.playerDetected = false;
    this.targetOff = new Vector(0,0);
    this.extendingPullStrength = 0.03;
    this.recedingPullStrength = 0.08;
    this.pullStrength = 1;
  }
  behavior(time, area, offset, players){
    const timeFix = time / (1000 / 30);
    this.pos.x = this.parent.pos.x + this.off.x;
    this.pos.y = this.parent.pos.y + this.off.y;
    console.log(this.freeze);
    if (distance(players[0].pos, new Vector(this.parent.pos.x + offset.x, this.parent.pos.y + offset.y)) < players[0].radius + this.detectionRadius && !players[0].safeZone && !players[0].night && !players[0].isDead) {
      this.targetOff = new Vector((this.parent.pos.x + offset.x - players[0].pos.x) * -1,(this.parent.pos.y + offset.y - players[0].pos.y) * -1);
      this.pullStrength = this.extendingPullStrength;
    } else {
      this.targetOff = new Vector(0,0);
      this.pullStrength = this.recedingPullStrength;
    }
    this.off.x += (this.targetOff.x - this.off.x) * this.pullStrength * timeFix;
    this.off.y += (this.targetOff.y - this.off.y) * this.pullStrength * timeFix;
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
  }
}

class Disc extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("disc") - 1, radius, speed, angle, "#1049a3");
    this.imune = true;
    this.corrosive = true;
    this.renderedAsRing = true;
  }
}

class Swamp extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("swamp") - 1, radius, speed, angle, "#0b360b", true, "rgba(11, 54, 11, 0.25)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.swamp = true;
    }
  }
}

class SapSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sap_sniper") - 1, radius, speed, angle, "#d6ac42");
    this.releaseTime = 2000;
    this.clock = Math.random() * this.releaseTime;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      var min = 18.75;
      var index;
      var boundary = area.getActiveBoundary();
      for (var i in players) {
        if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min && pointInRectangle(new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
          min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
          index = i;
        }
      }
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(18, this.pos, Math.atan2(dY, dX), this.radius / 2, 10)
        this.clock = 0;
      }
    }
  }
}

class SapSniperProjectile extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#b89414");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.Harmless = false;
    this.clock = 0;
    this.weak = true;
  }
  behavior(time, area, offset, players){
    this.clock += time;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      player.swampDebuff += 0.35;
      if (player.swampDebuff < 0.8){
        player.sapTimer = 4000;
      }
      this.vel.x = Math.cos(0) * this.speed;
      this.vel.y = Math.sin(0) * this.speed;
      this.toRemove = true;
    }
  }
}