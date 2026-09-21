document.addEventListener('DOMContentLoaded', function () {
    const radioCliente = document.getElementById('cliente');
    const radiosVisiveis = document.querySelectorAll('#lojista, #administrador');

    for (const radio of radiosVisiveis) {
        radio.dataset.jaEstavaMarcado = radio.checked;

        radio.addEventListener('click', function () {
            if (this.dataset.jaEstavaMarcado === 'true') {
                // já estava marcado: volta pro perfil Cliente
                radioCliente.checked = true;
            }

            // atualiza o estado de todos pra próxima checagem
            for (const r of radiosVisiveis) {
                r.dataset.jaEstavaMarcado = r.checked;
            }
        });
    }
});