const KurentoController = require('./kurento');
const Monitor = require('../models/monitor');
const MonitorsSource = require('../sources/monitors');
const KurentoConnectionSource = require('../sources/kurentoConnection');

class MonitorController {
    async start(socket, data, callback) {
        try {
            const {url} = data;

            const connection = await KurentoController.connect(url, err => {
                socket.emit('app:error', {message: err})
            });

            const existedMonitor = MonitorsSource.get(socket);
            if (existedMonitor) {
                this.releaseMonitor(existedMonitor, socket);
            }

            const manager = await KurentoController.getServerManager(connection.get());
            const monitor = new Monitor(manager.get());
            MonitorsSource.add(socket, monitor);
            KurentoConnectionSource.add(socket, connection.get());

            monitor.on('pipelines', pipelinesInfo => socket.emit('monitor:pipelines', pipelinesInfo));
            monitor.on('serverInfo', serverInfo => socket.emit('monitor:serverInfo', serverInfo));
            monitor.start();

            callback && callback();
        } catch (err) {
            console.log(err);
        }
    }

    async disconnect(socket) {
        const monitor = MonitorsSource.get(socket);
        if (monitor) {
            this.releaseMonitor(monitor, socket);
        }
    }

    releaseMonitor(monitor, socket) {
        monitor.stop();
        MonitorsSource.remove(socket);
        KurentoConnectionSource.remove(socket);
    }
}

module.exports = new MonitorController();
