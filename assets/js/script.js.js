// Declarando todas las variables al inicio
let dataIndicadorCl = null;
let chartInstance = null;
const selectMoneda = document.getElementById('selectMoneda');
const montoCLPInput = document.getElementById('montoCLP');
const resultadoConversionElement = document.getElementById('resultadoConversion');
const historialMonedaCanvas = document.getElementById('historialMoneda').getContext('2d');
const errorMensajeElement = document.getElementById('errorMensaje');
const ignoreFields = ['version', 'autor', 'fecha'];

document.addEventListener('DOMContentLoaded', () => {
    inicializar();
});

async function inicializar() {
    try {
        const response = await fetch('https://mindicador.cl/api/');
        if (!response.ok) {
            throw new Error('No se pudo obtener los datos');
        }
        dataIndicadorCl = await response.json();
        llenarOpciones(dataIndicadorCl);
        chartInstance = new Chart(historialMonedaCanvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '',
                    data: [],
                    fill: false,
                    tension: 0.2
                }]
            }
        });
    } catch (error) {
        errorMensajeElement.innerText = `Ha ocurrido un error: ${error.message}`;
    }
}

function llenarOpciones(data) {
    const options = Object.keys(data)
        .filter(key => !ignoreFields.includes(key))
        .map(key => {
            if (data[key]) {
                return `<option value="${key}">${data[key].nombre}</option>`;
            }
            return '';
        })
        .join('');
    selectMoneda.innerHTML = options;
}

async function convertirMoneda() {
    const montoCLP = montoCLPInput.value;
    const monedaSeleccionada = selectMoneda.value;

    const tasaCambio = dataIndicadorCl[monedaSeleccionada].valor;
    const resultado = montoCLP / tasaCambio;

    resultadoConversionElement.innerText = `El monto en ${monedaSeleccionada} es: ${resultado.toFixed(2)}`;
    actualizarGrafico(monedaSeleccionada);
}

async function actualizarGrafico(moneda) {
    try {
        const respuesta = await fetch(`https://mindicador.cl/api/${moneda}`);
        const data = await respuesta.json();

        const fechas = data.serie.slice(0, 10).map(item => {
            const date = new Date(item.fecha);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        }).reverse();

        const valores = data.serie.slice(0, 10).map(item => item.valor).reverse();

        chartInstance.data.labels = fechas;
        chartInstance.data.datasets[0].data = valores;
        chartInstance.data.datasets[0].label = `${data.nombre}. Valores de los últimos 10 días`;
        chartInstance.update();
    } catch (error) {
        errorMensajeElement.innerText = `Ha ocurrido un error: ${error.message}`;
    }
}
