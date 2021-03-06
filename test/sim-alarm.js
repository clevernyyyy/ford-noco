/* eslint-disable linebreak-style */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const mockVehicles = require('../vehicles');

const should = chai.should();
const { expect } = chai;

const { server } = app;
const { vehicleData } = app;

chai.use(chaiHttp);

describe('Sim Alarm tests', () => {
  beforeEach((done) => {
    done();
  });
  describe('POST /sim/alarm/:vehicleId', () => {
    describe('with valid vehicleId and query parameters', () => {
      it('it should return HTTP 200 status code', (done) => {
        const anyVehicleId = mockVehicles.ev1.vehicleId;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?enabled=true`)
          .send()
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
      it('it should return body with status code SUCCESS', (done) => {
        const anyVehicleId = mockVehicles.ev1.vehicleId;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?enabled=true`)
          .send()
          .end((err, res) => {
            expect(res.body.status).to.equal('SUCCESS');
            done();
          });
      });
    });
    describe('with enabled true', () => {
      it('it should set alarmEnabled to true', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?enabled=true`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmEnabled.should.be.true;
            done();
          });
      });
    });
    describe('with enabled false', () => {
      it('it should set alarmEnabled to false', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?enabled=false`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmEnabled.should.be.false;
            done();
          });
      });
    });
    describe('with state disabled', () => {
      it('it should set alarmEnabled to false', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=disabled`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmEnabled.should.be.false;
            done();
          });
      });
    });
    describe('with state enabled', () => {
      it('it should set alarmEnabled to true', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=enabled`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmEnabled.should.be.true;
            done();
          });
      });
    });
    describe('with state triggered', () => {
      it('it should set alarmEnabled to true', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=triggered`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmEnabled.should.be.true;
            done();
          });
      });
      it('it should set alarmTriggered to true', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmTriggered = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=triggered`)
          .send()
          .end(() => {
            vehicleData[0].extra.alarmTriggered.should.be.true;
            done();
          });
      });
    });
    describe('with state error', () => {
      it('it should set alarmEnabled to undefined', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=error`)
          .send()
          .end(() => {
            expect(vehicleData[0].extra.alarmEnabled).to.be.undefined;
            done();
          });
      });
      it('it should set alarmTriggered to undefined', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmTriggered = false;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}?state=error`)
          .send()
          .end(() => {
            expect(vehicleData[0].extra.alarmTriggered).to.be.undefined;
            done();
          });
      });
    });
    describe('with enabled parameter missing', () => {
      it('it should have http status code 400', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}`)
          .send()
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
      });
      it('it should have body status with ERROR', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}`)
          .send()
          .end((err, res) => {
            expect(res.body.status).to.equal('ERROR');
            done();
          });
      });
      it('it should have msg containing paraneter name (state)', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}`)
          .send()
          .end((err, res) => {
            expect(res.body.msg).to.contain('parameter \'state\'');
            done();
          });
      });
      it('it should have msg containing allowed values', (done) => {
        const anyVehicleId = vehicleData[0].vehicle.vehicleId;
        vehicleData[0].extra.alarmEnabled = true;
        chai.request(server)
          .post(`/sim/alarm/${anyVehicleId}`)
          .send()
          .end((err, res) => {
            expect(res.body.msg).to.contain('enabled, disabled, triggered, error');
            done();
          });
      });
    });
  });
});
