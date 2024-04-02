class EnemyEffect {
  constructor(duration, source, priority){
    this.duration = duration;
    this.life = duration;
    this.noDuration = duration === -1;
    this.source = source;
    this.priority = priority;
    this.toRemove = false;
  }
  apply(time, target){
    if (!this.noDuration){
      this.life -= time;
      if (this.life < 0){
        this.toRemove = true;
        return;
      }
    }
    this.doEffect(time, target, this.source);
  }
}

class JudgementEffect extends EnemyEffect{
  constructor(duration, source){
    super(duration, source, 1000);
  }
  doEffect(time, target, source){
    target.radiusMultiplier = Math.min((source.radius / target.fixedRadius), 1);
    target.speedMultiplier = Math.min(source.speed / target.speed, 1);
    //uncomment for superhot minerva
    //target.speedMultiplier = Math.min((Math.sqrt(source.vel.x * source.vel.x + source.vel.y * source.vel.y)) / target.speed, 1);
  }
}

class Minerva extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#698db6", "Minerva");
    this.hasAB = true; this.ab1L = 5; this.ab2L = 0; this.firstTotalCooldown = 8000; this.secondTotalCooldown = 8000;
    this.judgementDuration = 5000;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0) {
      if(this.aura && this.energy>=20){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (270 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].addEffect(new JudgementEffect(this.judgementDuration, this));
              }
            }
          }
        }
        this.aura = false;
        this.auraType = -1;
        this.energy -= 20;
        this.firstAbilityCooldown = this.firstTotalCooldown;
      } else {this.aura = true; this.auraType = 5;}
    }
  }
}

class Grom extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#8dcc8f", "Grom");
    this.hasAB = true; this.ab1L = 0; this.ab2L = 0; this.firstTotalCooldown = 8; this.secondTotalCooldown = 0;
    this.corrodeUses = 0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 15) {
      this.corrodeUses++;
      if (this.corrodeUses >= 2){
        this.corrodeUses = 0;
        this.firstAbilityCooldown = this.firstTotalCooldown;
      }
      this.energy -= 15;
      this.spawnBullet(area,'corrode_projectile')
    }
  }
  spawnBullet(area,bulletType){
    let angle;
    if(this.mouseActive){
      angle = this.mouse_angle
    } else {
      //FUCKCKKCKKCKCKCKCKCK
      var directionX = 0;
      var directionY = 0;
      if(this.oldPos.x-this.pos.x<0){directionX = 1;}
      else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
      if(this.oldPos.y-this.pos.y<0){directionY = 1;}
      else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
      angle = Math.atan2(directionY, directionX);
    }
    const world = game.worlds[this.world];
    console.log(world);
    const bullet = new CorrodeProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle,this.world)
    if(!area.entities[bulletType]){area.entities[bulletType] = []}
    area.entities[bulletType].push(bullet);
  }
}

class CorrodeProjectile extends Enemy {
  constructor(pos,angle, world) {
    super(pos, entityTypes.indexOf("corrode_projectile") - 1, 16/32, undefined, undefined, "#88cc00");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.imune = true;
    this.speed = 20;
    this.outline = false;
    this.world = world;
    this.isEnemy = false;
    this.angleToVel();
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>=800){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && entity.isEnemy) {
          this.toRemove = true;
          this.spawnBullet(area,'corrode_projectile_exploded')
          return;
        }
      }
    }
  }
  spawnBullet(area,bulletType){
    //no angle sorry
    const bullet = new CorrodeProjectileExploded(new Vector(this.pos.x,this.pos.y),0)
    if(!area.entities[bulletType]){area.entities[bulletType] = []}
    area.entities[bulletType].push(bullet);
  }
  interact(){}
}

class CorrodeProjectileExploded extends Enemy {
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("corrode_projectile") - 1, 16/32, undefined, undefined, "#88cc0066");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.imune = true;
    this.isEnemy = false;
    this.speed = 0;
    this.outline = false;
    this.angleToVel();
  }
  behavior(time, area, offset, players) {
    if (this.fixedRadius < 125/32){
      this.fixedRadius += 2/32;
      if (this.fixedRadius > 125/32){
        this.fixedRadius = 125/32;
      }
    }
    this.clock += time;
    if(this.clock>=5000){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.imune) {
          entity.addEffect(new CorrodeEffect(-1, this))
        }
      }
    }
  }
  interact(){}
}


class CorrodeEffect extends EnemyEffect{
  constructor(duration, source){
    super(duration, source, 100);
    this.targets = [];
    this.targetMultipliers = [];
  }
  doEffect(time, target, source){
    if (source.toRemove){
      this.toRemove = true;
    }
    if (this.targets.indexOf(target) === -1){
      this.targets.push(target);
      this.targetMultipliers.push(1);
    }
    if (this.targetMultipliers[this.targets.indexOf(target)] !== -1){
      //this is the most kludge shit i will (hopefully) ever do in my entire life.
      //one permanent corrode effect is being applied every frame, which probably
      //sucks for keeping behavior consistent across framerates
      //and its also stupid. why would i even need to fucking do this?
      this.targetMultipliers[this.targets.indexOf(target)] -= 0.001 * time / (1000/60);
      if (target.speedMultiplier <= 0.01){
        this.targetMultipliers[this.targets.indexOf(target)] === -1;
        target.HarmlessEffect = 3000;
        target.Harmless = true;
        return;
      }
      target.speedMultiplier *= this.targetMultipliers[this.targets.indexOf(target)];
      if (!(distance(source.pos, new Vector(target.pos.x, target.pos.y)) < source.radius + target.radius)) {
        this.toRemove = true;
      }
    }
  }
}