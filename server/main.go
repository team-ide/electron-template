package main

import (
	"errors"
	"flag"
	"fmt"
	"github.com/gin-gonic/gin"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	addr       = flag.String("addr", "", "服务地址：:8080、127.0.0.1:8080")
	isElectron = flag.String("isElectron", "", "isElectron为1，则通过控制台输入保活，控制台关闭则服务关闭")
)

func flagParse() {
	defer func() {
		if e := recover(); e != nil {
			fmt.Println(e)
		}
	}()
	flag.Parse()
}

var (
	version = ""
)

func GetVersion() string {
	return version
}

func main() {
	flagParse()

	var waitGroupForStop sync.WaitGroup
	waitGroupForStop.Add(1)

	var err error

	if *addr == "" {
		*addr = ":8080"
	}
	var serverUrl string
	serverUrl, err = startServer(*addr)
	if err != nil {
		panic(err)
	}

	if *isElectron == "1" {
		_, _ = os.Stdout.Write([]byte("event:serverUrl:" + serverUrl))
		go func() {
			var buf = make([]byte, 1024)
			var err error
			for {
				_, err = os.Stdin.Read(buf)
				if err != nil {
					if err == io.EOF {
						err = nil
					}
					break
				}
				if strings.HasPrefix(string(buf), "event:call:stop") {
					waitGroupForStop.Done()
					return
				}
			}
			if err == nil {
				err = errors.New("electron window closed")
			}
			waitGroupForStop.Done()
			panic(err)
		}()
	}

	waitGroupForStop.Wait()

}

func startServer(addr string) (serverUrl string, err error) {

	gin.DefaultWriter = &nullWriter{}

	router := gin.Default()

	router.MaxMultipartMemory = (1024 * 50) << 20 // 设置最大上传大小为50G

	routerGroup := router.Group("/")

	routerGroup.GET("", func(c *gin.Context) {
		c.Status(200)
		const templateText = `Server Index: {{printf "%s" .}}`
		tmpl, err := template.New("index.html").Parse(templateText)
		if err != nil {
			log.Fatalf("parsing: %s", err)
		}
		_ = tmpl.Execute(c.Writer, "Server Version:"+GetVersion())
	})

	if strings.HasPrefix(addr, ":") {
		serverUrl = "http://127.0.0.1" + addr
	} else {
		serverUrl = "http" + "://" + addr
	}

	go func() {
		err = router.Run(addr)
		if err != nil {
			return
		}
	}()
	var checkStartSecond = time.Now().Unix()
	for {
		var newTime = time.Now().Unix()
		if (newTime - checkStartSecond) > 5 {
			break
		}
		time.Sleep(time.Millisecond * 100)
		checkURL := serverUrl
		if err != nil {
			break
		}
		res, e := http.Get(checkURL)
		if e != nil {
			continue
		}
		if res == nil {
			continue
		}
		if res.StatusCode == 200 {
			_ = res.Body.Close()
			break
		}
	}

	return
}

type nullWriter struct{}

func (*nullWriter) Write(bs []byte) (int, error) {

	return 0, nil
}
