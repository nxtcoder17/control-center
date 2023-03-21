package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
)

func main() {
	var staticDir string
	flag.StringVar(&staticDir, "dir", ".", "--dir <static-dir-path>")

	var addr string
	flag.StringVar(&addr, "addr", ":3000", "--addr <host>:<port>")

	flag.Parse()

	fmt.Println(staticDir)

	fs := http.FileServer(http.Dir(staticDir))
	http.Handle("/", fs)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalln(err)
	}
}
