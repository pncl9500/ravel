class EnemyEffect {
  constructor(duration, source, priority, allowDupes = false){
    this.duration = duration;
    this.life = duration;
    this.noDuration = duration === -1;
    this.source = source;
    this.priority = priority;
    this.toRemove = false;
    //this shit does not work, i give up
    // this.allowDupes = allowDupes;
    // if (!allowDupes){
    //   for (var i = 0; i < source.effects.length; i++){
    //     if (source.effects[i].constructor.name === this.constructor.name){
    //       this.toRemove = true;
    //       return;
    //     }
    //   }
    // }
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
    this.allowDupes = false;
  }
  doEffect(time, target, source){
    target.radiusMultiplier = Math.min((source.radius / target.fixedRadius), 1);
    target.speedMultiplier = Math.min(source.speed / target.speed, 1);
    //uncomment for superhot minerva
    //target.speedMultiplier = Math.min((Math.sqrt(source.vel.x * source.vel.x + source.vel.y * source.vel.y)) / target.speed, 1);
  }
}

class CalmEffect extends EnemyEffect{
  constructor(duration, source, originalTarget){
    super(duration, source, 10);
    this.allowDupes = false;
    this.angle = originalTarget.angle;
  }
  doEffect(time, target, source){
    target.speedMultiplier *= 0.4
    target.angle = this.angle;
    target.angleToVel();
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
    this.hasAB = true; this.ab1L = 5; this.ab2L = 0; this.firstTotalCooldown = 8000; this.secondTotalCooldown = 0;
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
      this.spawnBullet(area,'corrode_projectile_exploded')
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
    super(duration, source, 100, true);
    this.targets = [];
    this.targetMultipliers = [];
    this.allowDupes = true;
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
        target.auraDisabledEffect = 3000;
        target.auraDisabled = true;
        return;
      }
      target.speedMultiplier *= this.targetMultipliers[this.targets.indexOf(target)];
      if (!(distance(source.pos, new Vector(target.pos.x, target.pos.y)) < source.radius + target.radius)) {
        this.toRemove = true;
      }
    }
  }
}

class Cibus extends Player {
  //da eetah
  constructor(pos, speed) {
    super(pos, 0, speed, "#FFA588", "Cibus");
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 3500; this.secondTotalCooldown = 200;
    this.enemiesEaten = 0;
    this.consume = false;
    this.fixedRadius = 18.56/32;
    this.eatenEnemies = [];
  }
  abilities(time,area,offset){
    this.speedAdditioner -= this.enemiesEaten;
    if (this.enemiesEaten < 3){
      if (this.firstAbilityCooldown === 0 && this.enemiesEaten < 3) {
        this.consume = true;
      }
      this.color = "#FFA588";
    } else {
      this.color = "#AA7122";
    }
    if (this.isDead){
      this.enemiesEaten = 0;
      this.eatenEnemies = [];
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 5 * this.enemiesEaten && this.enemiesEaten > 0) {
      this.energy -= 5 * this.enemiesEaten;
      this.secondAbilityCooldown = this.secondTotalCooldown;
      for (var i = 0; i < this.eatenEnemies.length; i++){
        this.spawnBullet(area, "expel_projectile",i)
      }
      this.eatenEnemies = [];
      this.enemiesEaten = 0;
      this.invicible = true;
      //if the framerate is too low the player will probably die instantly upon using this ability. too bad!
      this.invicible_time = 200;
    }
  }
  removeConsume(){
    this.enemiesEaten++;
    this.consume = false;
    this.firstAbilityCooldown = this.firstTotalCooldown;
  }
  undoConsume(){
    for (var i = 0; i < this.eatenEnemies.length; i++){
      this.eatenEnemies[i].undoConsume();
    }
    this.invicible = true;
    this.eatenEnemies = [];
    this.enemiesEaten = 0;
  }
  doTeleEffect(){
    this.undoConsume();
  }
  spawnBullet(area,bulletType,i){
    let angle;
    if(this.mouseActive){
      angle = this.mouse_angle;
    } else {
      var directionX = 0;
      var directionY = 0;
      if(this.oldPos.x-this.pos.x<0){directionX = 1;}
      else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
      if(this.oldPos.y-this.pos.y<0){directionY = 1;}
      else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
      angle = Math.atan2(directionY, directionX);
    }
    const world = game.worlds[this.world];
    const bullet = new ExpelProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle + (Math.random() - 0.5) * 0.1, this.eatenEnemies[i]);
    if(!area.entities[bulletType]){area.entities[bulletType] = []}
    area.entities[bulletType].push(bullet);
  }
}

class ExpelProjectile extends Enemy{
  constructor(pos,angle,tiedEnemy) {
    super(pos, entityTypes.indexOf("corrode_projectile") - 1, 16/32, undefined, undefined, "#00000000");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.imune = true;
    this.speed = 40;
    this.outline = false;
    this.isEnemy = false;
    this.tiedEnemy = tiedEnemy;
    this.tiedEnemy.consume = false;
    this.tiedEnemy.isExpelBullet = this;
    this.tiedEnemy.no_collide = false;
    this.tiedEnemy.collide = true;
    this.tiedEnemy.Harmless = true;
    this.angleToVel();
  }
  behavior(time, area, offset, players) {
    this.tiedEnemy.pos.x = this.pos.x;
    this.tiedEnemy.pos.y = this.pos.y;
    this.clock += time;
    if(this.clock>=400){
      this.toRemove = true;
      this.tiedEnemy.isExpelBullet = false;
    } 
  }
  
}

class Hestia extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#9f395b", "Hestia");
    this.hasAB = true; this.ab1L = 0; this.ab2L = 5; this.firstTotalCooldown = 10; this.secondTotalCooldown = 5000;
    this.calmDuration = 4000;
  }
  abilities(time, area, offset) {
    if (this.secondAbility && this.secondAbilityCooldown == 0) {
      if(this.aura && this.energy>=20){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (200 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].addEffect(new CalmEffect(this.calmDuration, this, area.entities[i][j]));
                area.entities[i][j].auraDisabled = true;
                area.entities[i][j].auraDisabledEffect = this.calmDuration;

              }
            }
          }
        }
        this.aura = false;
        this.auraType = -1;
        this.energy -= 10;
        this.secondAbilityCooldown = this.secondTotalCooldown;
      } else {this.aura = true; this.auraType = 6;}
    }
  }
}
