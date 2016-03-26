'use strict';
class Vector {

	constructor (x, y, z) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	clone () {
		return new Vector(this.x, this.y, this.z);
	}

	copy (v) {
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		return this;
	}

	add (v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	addScalar (s) {
		this.x += s;
		this.y += s;
		this.z += s;
		return this;
	}

	addVectors (a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		return this;
	}

	addScaledVector (v, s) {
		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;
		return this;
	}

	sub (v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}

	subScalar (s) {
		this.x -= s;
		this.y -= s;
		this.z -= s;
		return this;
	}

	subVectors (a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		return this;
	}

	multiply (v) {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
		return this;
	}

	multiplyScalar (s) {
		if (isFinite(s)) {
			this.x *= s;
			this.y *= s;
			this.z *= s;
		} else {
			this.x = 0;
			this.y = 0;
			this.z = 0;
		}
		return this;
	}

	multiplyVectors (a, b) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;
		return this;
	}

	divideScalar (s) {
		return this.multiplyScalar(1 / s);
	}

	min (v) {
		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );
		return this;
	}

	max (v) {
		this.x = Math.max(this.x, v.x);
		this.y = Math.max(this.y, v.y);
		this.z = Math.max(this.z, v.z);
		return this;
	}

	clamp (min, max) {
		this.x = Math.max(min.x, Math.min(max.x, this.x));
		this.y = Math.max(min.y, Math.min(max.y, this.y));
		this.z = Math.max(min.z, Math.min(max.z, this.z));
		return this;
	}

	clampScalar (minVal, maxVal) {
		this.x = Math.max(minVal, Math.min(maxVal, this.x));
		this.y = Math.max(minVal, Math.min(maxVal, this.y));
		this.z = Math.max(minVal, Math.min(maxVal, this.z));
		return this;
	}

	clampLength (min, max) {
		const length = this.length();
		this.multiplyScalar(Math.max(min, Math.min(max, length)) / length);
		return this;
	}

	floor () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		this.z = Math.floor(this.z);
		return this;
	}

	ceil () {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		this.z = Math.ceil(this.z);
		return this;
	}

	round () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		this.z = Math.round(this.z);
		return this;
	}

	roundToZero () {
		this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
		this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
		this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z);
		return this;
	}

	negate () {
		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;
		return this;
	}

	dot (v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	lengthSq () {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	length () {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	lengthManhattan () {
		return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
	}

	normalize () {
		return this.divideScalar(this.length());
	}

	setLength (l) {
		return this.multiplyScalar(l / this.length());
	}

	lerp (v, alpha) {
		this.x += (v.x - this.x) * alpha;
		this.y += (v.y - this.y) * alpha;
		this.z += (v.z - this.z) * alpha;
		return this;
	}

	lerpVectors (v1, v2, alpha) {
		this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
		return this;
	}

	cross (v) {
		const x = this.x, y = this.y, z = this.z;
		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;
		return this;
	}

	crossVectors (a, b) {
		const ax = a.x, ay = a.y, az = a.z;
		const bx = b.x, by = b.y, bz = b.z;
		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;
		return this;
	}

	angleTo (v) {
		const theta = this.dot(v) / (this.length() * v.length());
		return Math.acos(Math.max(-1, Math.min(1, theta)));
	}

	distanceTo (v) {
		return Math.sqrt(this.distanceToSquared(v));
	}

	distanceToSquared (v) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		const dz = this.z - v.z;
		return dx * dx + dy * dy + dz * dz;
	}

	equals (v) {
		return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z));
	}

	fromArray (array, offset) {
		if (offset === undefined) {
			offset = 0;
		}
		this.x = array[offset];
		this.y = array[offset + 1];
		this.z = array[offset + 2];
		return this;
	}

	toArray (array, offset) {
		if (array === undefined) {
			array = [];
		}
		if (offset === undefined) {
			offset = 0;
		}
		array[offset] = this.x;
		array[offset + 1] = this.y;
		array[offset + 2] = this.z;
		return array;
	}

	applyMatrix (m) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
		this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
		this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

		return this;

	}

}
