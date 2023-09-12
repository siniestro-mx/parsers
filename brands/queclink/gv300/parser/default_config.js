const serverIp = '159.203.145.94';
const gv300Port = 5500;
let defaultConfig = '';

/**
*   Esta función carga la configuración predeterminada que espera Locanet. Envía los siguientes comandos al dispositivo.
*
*   - (Bearer Setting Information)
*       El comando AT+GTBSI se utiliza para configurar los parámetros de GPRS.
*       Los parámetros incluyen APN, nombre de usuario, contraseña y dirección IP del servidor.
*     
*     Descripción:
*       AT+GTBSI=contraseña,apn,usuario,contraseña,bkp_apn,bkp_apn_usuario,bkp_apn_contraseña,reservado,número_de_serie$
*                   0      1     2        3           4           5               6               7            8
*     Ejemplo:
*       AT+GTBSI=gv300,internet.itelcel.com,webgprs,webgprs2002,internet.itelcel.com,webgprs,webgprs2002,,FFFF$
* 
*/
defaultConfig += `AT+GTBSI=gv300,internet.itelcel.com,webgprs,webgprs2002,internet.itelcel.com,webgprs,webgprs2002,,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Server Request Information)
*       El comando AT+GTSRI se utiliza para configurar cómo reportar todos los mensajes, incluida la información
*       y el método de comunicación entre el terminal y el servidor backend. Si el terminal
*       está configurado correctamente, debería poder reportar datos al servidor backend.
*      
*      Descripción:
*      AT+GTSRI=contraseña, modo_de_reporte, reservado, modo_de_almacenamiento, ip_o_dominio_del_servidor_principal, puerto_del_servidor_principal,
*                   1               2            3                 4                             5                                   6                                   
*               ip_o_dominio_del_servidor_de_respaldo, puerto_del_servidor_de_respaldo, sms_gateway, intervalo_de_heartbit, habilitar_sack,
*                                   7                                    8                   9                10                  11
*               formato_del_protocolo, habilitar_sms_ack, reservado, reservado, número_de_serie$
*                        12                    13            14          15           16
*     
*     Ejemplo:
*       AT+GTSRI=gv300,4,,1,${serverIp},${gv300Port},,,,0,0,0,1,,,FFFF$
*/
defaultConfig += `AT+GTSRI=gv300,4,,1,${serverIp},${gv300Port},,,,0,0,0,1,,,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Quick Start Setting)
*       El comando AT+GTQSS es una combinación de los datos minimos necesarios de los dos comandos anteriores.
*       No lo utilizamos, porque ya utilizamos los dos anteriores, para tener un mayor control sobre la configuración.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**     
*     - (Global Configuration)
*       El comando AT+GTCFG se utiliza para configurar la configuración global del terminal. Puede cambiar
*       el password, el nombre, habilitar o deshabilitar, odometro, establecer un odometro inicial, GPS on need, 
*       configurar el envio o no de ciertos parametros como: Velocidad, Rumbo, Altitud, MCC, MNC, LAC y CellID,
*       Odometro, SendTime y DeviceName, el modo ahoro de energia (power saving), event mask, 
*       configurar el uso que se le dara al pin15 si como input digital o analoga, la configuración de los led,
*       envio del reporte +RESP:GTINF, intervalo de envío de +RESP:GTINF, configuración de ubicación por llamada,
*       supresion de eco, modo de carga de la bateria de respaldo, modo AGPS, envio de +RESP:GTGSM,sepal gps perdida 
*      
*      Descripción:
*      AT+GTCFG=password, newPassword, DeviceName, ODOEnable, ODOInitialMileage, GPSOnNeed,
*                   1          2            3         4               5              6                                   
*               reserved, reportCompositionMask, powerSavingMode, reserved,  eventMask, pin15Mode,
*                  7                8                   9            10          11        12
*               ledOn, infoReportEnable, infoReportInterval, LocationByCall, echoSuppression, backupBatteryMode,
*                 13          14                15                16               17                 18           
*               AGPSMode, GSMReport, GPSLostTime, SerialNumber$
*                  19         20          21          22
*     
*     Ejemplo:
*       AT+GTCFG=gv300,,,1,0,0,,003F,1,,3FFFF,1,0,1,43200,1,1,1,1,0000,10,FFFF$
*                  
*/
defaultConfig += `AT+GTCFG=gv300,,,1,0,0,,003F,1,,3FFFF,1,0,1,43200,1,1,1,1,0000,10,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Digital Output)
*       El comando, AT+GTOUT, se utiliza habilitar la señal en las salidas digitales. Tiene disponible, 4 tipos de
*       señales. Es el comando que se utiliza para activar/desactivar el paro de motor en la unidad.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Digital Input Port Setting)
*       El comando AT+GTDIS se usa para configurar las entradas digitales. Solo se pueden configurar los pines 1 al 3,
*       ya que el pin0 esta asignado a la entrada de ignición.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Input-Output Port Binding)
*       El comando AT+GTIOB se usa para configurar la activación de las salidas digitales, en base a las entradas digitales.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**   
*     - (External Power Supply Monitoring)
*       El comando AT+GTEPS se utiliza para configurar los parámetros de monitoreo de la fuente de alimentación externa. 
*       ELl dispositivo estará monitoreando cada cierto lapso de tiempo el voltaje externo, y de acuerdo a la configuración
*       enviará un reporte +RESP:GTEPS, cuando el voltaje externo este fuera o dentro del rango establecido.
*
*      Descripción:
*      AT+GTEPS=password, mode, minTreshold, maxTreshold, samplePeriod, debounceTime,
*                   1      2         3           4              5           6                                   
*               outputId, outputStatus, duration, toggleTimes, syncWithFry, reserved,
*                   7          8           9          10           11          12
*               reserved, reserved, serialNumber$
*                 13          14         15         
*     
*     Ejemplo:
*       AT+GTCFG=gv300,,,1,0,0,,003F,1,,3FFFF,1,0,1,43200,1,1,1,1,0000,10,FFFF$
*/
defaultConfig += `AT+GTEPS=gv300,2,11000,32000,1,5,0,0,0,0,1,,,,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Analog Input Port Setting)
*       El comando, AT+GTAIS, se utiliza para configurar los parámetros de los puertos de entrada analógicos.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Fixed Report Information)
*       El comando AT+GTFRI se usa para configurar la información de reporte periódico fijo, que puede ser
*       +RESP:GTFRI el default o +RESP:GTERI, cuando el dispositivo tiene conectado un sensor.
*
*      Descripción:
*      AT+GTFRI=password, mode, discardNoFix, reserved, periodEnable, startTime,
*                   1      2         3           4           5           6                                   
*               endTime, checkInterval, sendInterval, distance, mileage, reserved,
*                  7           8             9          10        11        12
*               cornerReport, ignitionOffReportInterval, ERIMask, reserved, reserved, reserved,
*                   13                   14                15        16        17        18
*               serialNumber$ 
*                   19
*     
*     Ejemplo:
*       AT+GTFRI=gv300,1,0,,0,0000,0000,60,60,1000,1000,reserved,25,1800,00000000,,,,FFFF$
*/
defaultConfig += `AT+GTFRI=gv300,1,0,,0,0000,0000,60,60,1000,1000,reserved,25,1800,00000000,,,,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Geo-Fence Information)
*       El comando, AT+GTGEO se utiliza para configurar los parametros de las geocercas. Las geocercas son
*       perímetros virtuales, de tal forma que, cuando el dispositivo entre o salga de una geocerca, se envía un mensaje.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Tow Alarm Configuration)
*       El comando, AT+GTTOW se utiliza para configurar los parametros de la alarma de remolque y el sensor de movimiento.
*       Se debe configurar el tiempo de espera para que se active la alarma de remolque, despues de detectar movimiento,
*       con la ignición apagada. El tiempo de espera se configura en minutos.
*
*      Descripción:
*      AT+GTTOW=password, towEnable, engineOffToTow, fakeTowDelay, towInterval, towOutputId,
*                   1         2            3              4             5            6                                   
*               towOutputStatus, towOutputDuration, towOutputToggleTimes, restDuration, motionDuration, motionTreshold,
*                     7                  8                   9                 10             11             12
*               reserved, reserved, reserved, reserved, reserved, reserved,
*                   13      14         15        16        17        18
*               reserved, reserved, serialNumber$ 
*                   19       20         21
*     
*     Ejemplo:
*       AT+GTTOW=gv300,1,5,0,60,0,0,0,0,2,3,2,,,,,,,,,FFFF$
*/
defaultConfig += `AT+GTTOW=gv300,1,5,0,60,0,0,0,0,2,3,2,,,,,,,,,FFFF$`;

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Geo-Fence Information)
*       El comando, AT+GTGEO se utiliza para configurar los parametros de las geocercas. Las geocercas son
*       perímetros virtuales, de tal forma que, cuando el dispositivo entre o salga de una geocerca, se envía un mensaje.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Speed Alarm)
*       El comando, AT+GTSPD se utiliza para configurar los parametros de la alarma de exceso de velocidad.
*       Dependiendo del modo configurado, el dispositivo enviara un paquete +RESP:GTSPD cuando la unidad,
*       se encuentre dentro o fuera del rango especificado.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (SOS Funcion)
*       El comando, AT+GTSOS se utiliza para configurar la entrada que se utilizará como señal de SOS.
*       Al recibir la señal de SOS, se genera un mensaje +RESP:GTSOS. Se puede configurar una salida digital, para que
*       se active cuando se reciba la señal de SOS, y que el equipo realize una llamada al número indicado.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Voice Monitoring)
*       El comando, AT+GTMON se utiliza para configurar el monitoreo por voz. Soporta llamadas salientes y
*       entrantes. Cuando esta función se activa y se configura el envio de notificación al server,
*       el dispositivo en via un mensaje +RESP:GTMON.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - (Excessive Idling Detection)
*       El comando, AT+GTIDL se utiliza para configurar los parametros de detección de ralenti excesivo, 
*       es decir, cuando la unidad esta sin movimiento, pero el motor esta encendido.
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------

/**
*    - ()
*       El comando, AT+GTM
*       Esta configuración no la modificamos y se queda en su default, que es inhabilitado.
*/

//------------------------------------------------------------------------------------------------------------------------------



module.exports = defaultConfig;

/**
* Referencia
* GV300 Track Air Interface ProtocolV8.00.pdf
*/