import express from 'express'
import routesClientes from './routes/clientes'
import routesPagamentos from './routes/pagamentos'
import routesAlugueis from './routes/alugueis'
import routesBoxes from './routes/boxes'
import backupRoutes from './routes/backup'
import usuarios from './routes/usuarios'

const app = express()
const port = 3000

app.use(express.json())

app.use("/clientes", routesClientes)
app.use("/pagamentos", routesPagamentos)
app.use("/alugueis", routesAlugueis)
app.use("/boxes", routesBoxes)
app.use('/backup', backupRoutes);
app.use('/usuarios', usuarios)


app.get('/', (req, res) => {
  res.send('API: Controle de Alugueis/Vendas de Carros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})